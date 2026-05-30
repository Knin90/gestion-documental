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
}

function buscarColumna(row: any, nombres: string[]): string {
  for (const nombre of nombres) {
    if (row[nombre] !== undefined && row[nombre] !== "") {
      return row[nombre].toString().trim();
    }
  }
  return "";
}

function parsearFecha(valor: any): string {
  if (!valor) return "";
  if (typeof valor === "number") {
    const fecha = new Date((valor - 25569) * 86400 * 1000);
    return fecha.toISOString().split("T")[0];
  }
  const texto = valor.toString().trim();
  // DD/MM/YYYY o DD-MM-YYYY
  const partes = texto.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (partes) {
    return `${partes[3]}-${partes[2].padStart(2, "0")}-${partes[1].padStart(2, "0")}`;
  }
  // YYYY-MM-DD
  const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return texto;
  return "";
}

export default function ImportarPage() {
  const [tipo, setTipo] = useState<TipoDocumento | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [columnasDetectadas, setColumnasDetectadas] = useState<string[]>([]);
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
      const datos: any[] = utils.sheet_to_json(hoja, { defval: "" });

      if (datos.length === 0) {
        toast.error("El archivo está vacío");
        setProcesando(false);
        return;
      }

      const columnas = Object.keys(datos[0]);
      setColumnasDetectadas(columnas);

      const correctas: FilaPreview[] = [];
      const conError: FilaPreview[] = [];

      datos.forEach((row, index) => {
        const fila: FilaPreview = {
          fila: index + 2,
          document_id: buscarColumna(row, ["Identificador", "identificador", "ID", "Id", "id", "Codigo", "Código", "codigo"]) || null,
          description: buscarColumna(row, ["Descripción", "Descripcion", "descripción", "descripcion", "DESCRIPCION", "Detalle", "detalle", "Asunto", "asunto"]),
          signed_by: buscarColumna(row, ["Firmante", "firmante", "FIRMANTE", "Firma", "firma", "Remitente", "remitente"]) || null,
          addressed_to: buscarColumna(row, ["Destinatario", "destinatario", "DESTINATARIO", "Para", "para", "Dirigido", "dirigido"]) || null,
          document_date: "",
        };

        const fechaRaw = buscarColumna(row, ["Fecha", "fecha", "FECHA", "Fecha del documento", "fecha del documento"]);
        fila.document_date = parsearFecha(fechaRaw || row["Fecha"]);

        const errores: string[] = [];
        if (!fila.description) errores.push("Descripción vacía");
        if (!fila.document_date) errores.push("Fecha inválida");
        if (fila.description && fila.description.length > 500) errores.push("Descripción muy larga");

        if (errores.length > 0) {
          fila.error = errores.join(", ");
          conError.push(fila);
        } else {
          correctas.push(fila);
        }
      });

      setResultado({ correctas, conError });
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
            Columnas esperadas: Identificador (opcional), Descripción, Firmante (opcional), Destinatario (opcional), Fecha (DD/MM/AAAA)
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

          {/* Columnas detectadas */}
          {columnasDetectadas.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Columnas detectadas: {columnasDetectadas.join(", ")}
            </div>
          )}

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
              {resultado.correctas.length === 0 && resultado.conError.length > 10 && (
                <p className="text-xs text-yellow-800 font-medium pt-1">
                  Verifica que las columnas del Excel se llamen: Identificador, Descripción, Firmante, Destinatario, Fecha
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
                    <th className="px-2 py-2 text-left text-muted-foreground">ID</th>
                    <th className="px-2 py-2 text-left text-muted-foreground">Descripción</th>
                    <th className="px-2 py-2 text-left text-muted-foreground">Firmante</th>
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
