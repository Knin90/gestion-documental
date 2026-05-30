"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle } from "lucide-react";
import { importarDocumentos } from "@/app/actions/import-export";

type TipoDocumento = "recibido" | "enviado";

interface FilaPreview {
  fila: number;
  document_id: string | null;
  description: string;
  signed_by: string | null;
  addressed_to: string | null;
  document_date: string;
  error?: string;
}

interface ResultadoValidacion {
  correctas: FilaPreview[];
  conError: FilaPreview[];
  columnasDetectadas: string[];
  filaEncabezado: number;
}

function excelSerialToDate(serial: number): string {
  const fecha = new Date((serial - 25569) * 86400 * 1000);
  const y = fecha.getUTCFullYear();
  const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const d = String(fecha.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parsearFecha(valor: any): string {
  if (!valor && valor !== 0) return "";
  if (typeof valor === "number" && valor > 40000 && valor < 60000) {
    return excelSerialToDate(valor);
  }
  const texto = valor.toString().trim();
  const ddmmyyyy = texto.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return texto.substring(0, 10);
  return "";
}

function encontrarFilaEncabezado(filas: any[][]): number {
  for (let i = 0; i < Math.min(20, filas.length); i++) {
    const fila = filas[i];
    if (!fila) continue;
    const textos = fila.map((c) => (c ?? "").toString().toUpperCase().trim());
    if (textos.includes("FECHA") || textos.includes("ASUNTO") || textos.includes("N° NOTA")) {
      return i;
    }
  }
  return -1;
}

function validarYParsear(filasRaw: any[][]): ResultadoValidacion {
  const idxEncabezado = encontrarFilaEncabezado(filasRaw);

  if (idxEncabezado === -1) {
    return { correctas: [], conError: [], columnasDetectadas: [], filaEncabezado: -1 };
  }

  const encabezados = filasRaw[idxEncabezado].map((c: any) => (c ?? "").toString().trim());

  // Encontrar índices de columnas
  const idx = {
    nota: encabezados.findIndex((h: string) => /n[°º]\s*nota/i.test(h)),
    fecha: encabezados.findIndex((h: string) => /^fecha$/i.test(h)),
    procedencia: encabezados.findIndex((h: string) => /procedencia/i.test(h)),
    asunto: encabezados.findIndex((h: string) => /asunto/i.test(h)),
    atendido: encabezados.findIndex((h: string) => /atendido|asignado/i.test(h)),
  };

  const correctas: FilaPreview[] = [];
  const conError: FilaPreview[] = [];

  for (let i = idxEncabezado + 1; i < filasRaw.length; i++) {
    const row = filasRaw[i];
    if (!row) continue;

    // Saltar filas completamente vacías
    const tieneContenido = row.some((c: any) => c !== "" && c !== null && c !== undefined);
    if (!tieneContenido) continue;

    const description = idx.asunto >= 0 ? (row[idx.asunto] ?? "").toString().trim() : "";
    const fechaRaw = idx.fecha >= 0 ? row[idx.fecha] : "";
    const notaRaw = idx.nota >= 0 ? (row[idx.nota] ?? "").toString().trim() : "";

    // Saltar filas sin descripción ni fecha (probablemente basura)
    if (!description && !fechaRaw) continue;

    const fila: FilaPreview = {
      fila: i + 1,
      document_id: notaRaw || null,
      description,
      signed_by: idx.procedencia >= 0 ? (row[idx.procedencia] ?? "").toString().trim() || null : null,
      addressed_to: idx.atendido >= 0 ? (row[idx.atendido] ?? "").toString().trim() || null : null,
      document_date: parsearFecha(fechaRaw),
    };

    const errores: string[] = [];
    if (!fila.description) errores.push("Asunto vacío");
    if (!fila.document_date) errores.push("Fecha inválida");
    if (fila.description.length > 500) errores.push("Asunto muy largo (máx 500)");

    if (errores.length > 0) {
      fila.error = errores.join(", ");
      conError.push(fila);
    } else {
      correctas.push(fila);
    }
  }

  return {
    correctas,
    conError,
    columnasDetectadas: encabezados.filter((h: string) => h !== ""),
    filaEncabezado: idxEncabezado + 1,
  };
}

export default function ImportarPage() {
  const [tipo, setTipo] = useState<TipoDocumento | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [importando, setImportando] = useState(false);
  const router = useRouter();

  async function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file);
    setResultado(null);
    setProcesando(true);

    try {
      const { read, utils } = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: "array" });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const filasRaw: any[][] = utils.sheet_to_json(hoja, { defval: "", header: 1 });

      if (filasRaw.length === 0) {
        toast.error("El archivo está vacío");
        setProcesando(false);
        return;
      }

      const res = validarYParsear(filasRaw);

      if (res.filaEncabezado === -1) {
        toast.error("No se encontraron las columnas. Se esperan: FECHA, ASUNTO, N° NOTA");
        setProcesando(false);
        return;
      }

      setResultado(res);
    } catch (err) {
      toast.error("Error al leer el archivo Excel");
      console.error("Error leyendo Excel:", err);
    } finally {
      setProcesando(false);
    }
  }

  async function handleImportar() {
    if (!tipo || !resultado || resultado.correctas.length === 0) return;
    setImportando(true);

    const filas = resultado.correctas.map((f) => ({
      document_id: f.document_id,
      description: f.description,
      signed_by: f.signed_by,
      addressed_to: f.addressed_to,
      document_date: f.document_date,
    }));

    const res = await importarDocumentos(tipo, filas);

    if (res.success) {
      toast.success(`${res.importados} documento${res.importados !== 1 ? "s" : ""} importado${res.importados !== 1 ? "s" : ""}`);
      router.push(`/documentos?tipo=${tipo}`);
    } else {
      toast.error(res.error ?? "Error al importar");
      setImportando(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar desde Excel</h1>
        <p className="text-sm text-muted-foreground">
          Carga documentos desde un archivo .xlsx
        </p>
      </div>

      {/* Paso 1 — Tipo */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">1. Selecciona el tipo</h2>
        <p className="text-xs text-muted-foreground">
          Todos los documentos del archivo se registrarán con este tipo
        </p>
        <div className="flex gap-4">
          {(["recibido", "enviado"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo"
                value={t}
                checked={tipo === t}
                onChange={() => setTipo(t)}
                className="accent-sidebar-primary"
              />
              <span className="text-sm capitalize">{t === "recibido" ? "Recibidos" : "Enviados"}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Paso 2 — Archivo */}
      {tipo && (
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="text-sm font-semibold">2. Sube el archivo Excel</h2>
          <p className="text-xs text-muted-foreground">
            Se detectarán automáticamente las columnas: N° NOTA, FECHA, PROCEDENCIA, ASUNTO, ATENDIDO / ASIGNADO
          </p>
          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/30 transition-colors">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">
              {archivo ? archivo.name : "Click para seleccionar archivo .xlsx"}
            </span>
            {archivo && (
              <span className="text-xs text-muted-foreground mt-1">
                {(archivo.size / 1024).toFixed(1)} KB
              </span>
            )}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />
          </label>
          {procesando && (
            <p className="text-sm text-muted-foreground animate-pulse">Leyendo archivo...</p>
          )}
        </div>
      )}

      {/* Paso 3 — Resumen */}
      {resultado && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold">3. Resumen de validación</h2>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Encabezado detectado en fila {resultado.filaEncabezado}</p>
            <p>Columnas: {resultado.columnasDetectadas.join(" · ")}</p>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{resultado.correctas.length} correcta{resultado.correctas.length !== 1 ? "s" : ""}</span>
            </div>
            {resultado.conError.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>{resultado.conError.length} con error</span>
              </div>
            )}
          </div>

          {/* Errores — máximo 5 */}
          {resultado.conError.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-2">
              <p className="text-sm font-medium text-yellow-800">
                {resultado.conError.length} fila{resultado.conError.length !== 1 ? "s" : ""} con error (no se importarán):
              </p>
              {resultado.conError.slice(0, 5).map((f) => (
                <p key={f.fila} className="text-xs text-yellow-700">
                  Fila {f.fila}: {f.error}
                </p>
              ))}
              {resultado.conError.length > 5 && (
                <p className="text-xs text-yellow-600 font-medium">
                  ...y {resultado.conError.length - 5} error{resultado.conError.length - 5 !== 1 ? "es" : ""} más
                </p>
              )}
            </div>
          )}

          {/* Preview */}
          {resultado.correctas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left text-muted-foreground">Fila</th>
                    <th className="px-2 py-2 text-left text-muted-foreground">N° Nota</th>
                    <th className="px-2 py-2 text-left text-muted-foreground">Asunto</th>
                    <th className="px-2 py-2 text-left text-muted-foreground">Procedencia</th>
                    <th className="px-2 py-2 text-left text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resultado.correctas.slice(0, 10).map((f) => (
                    <tr key={f.fila}>
                      <td className="px-2 py-1.5 text-muted-foreground">{f.fila}</td>
                      <td className="px-2 py-1.5 font-mono">{f.document_id ?? "—"}</td>
                      <td className="px-2 py-1.5 max-w-xs truncate">{f.description}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{f.signed_by ?? "—"}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{f.document_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {resultado.correctas.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2 px-2">
                  ...y {resultado.correctas.length - 10} más
                </p>
              )}
            </div>
          )}

          {/* Botón importar */}
          {resultado.correctas.length > 0 && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleImportar}
                disabled={importando}
                className="flex items-center gap-2 rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {importando ? "Importando..." : `Importar ${resultado.correctas.length} documento${resultado.correctas.length !== 1 ? "s" : ""}`}
              </button>
              <button
                onClick={() => { setResultado(null); setArchivo(null); }}
                disabled={importando}
                className="rounded-lg border px-6 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
