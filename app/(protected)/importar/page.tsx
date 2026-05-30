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
      const datos: any[] = utils.sheet_to_json(hoja, { defval: "" });

      const correctas: FilaPreview[] = [];
      const conError: FilaPreview[] = [];

      datos.forEach((row, index) => {
        const fila: FilaPreview = {
          fila: index + 2,
          document_id: row["Identificador"]?.toString().trim() || null,
          description: row["Descripción"]?.toString().trim() || row["Descripcion"]?.toString().trim() || "",
          signed_by: row["Firmante"]?.toString().trim() || null,
          addressed_to: row["Destinatario"]?.toString().trim() || null,
          document_date: "",
        };

        // Parsear fecha
        const fechaRaw = row["Fecha"];
        if (fechaRaw) {
          if (typeof fechaRaw === "number") {
            // Excel serial date
            const fecha = new Date((fechaRaw - 25569) * 86400 * 1000);
            fila.document_date = fecha.toISOString().split("T")[0];
          } else {
            const partes = fechaRaw.toString().match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (partes) {
              fila.document_date = `${partes[3]}-${partes[2].padStart(2, "0")}-${partes[1].padStart(2, "0")}`;
            }
          }
        }

        // Validar
        const errores: string[] = [];
        if (!fila.description) errores.push("Descripción obligatoria");
        if (!fila.document_date) errores.push("Fecha inválida o vacía");
        if (fila.description && fila.description.length > 500) errores.push("Descripción muy larga (máx 500)");

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

          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{resultado.correctas.length} fila{resultado.correctas.length !== 1 ? "s" : ""} correcta{resultado.correctas.length !== 1 ? "s" : ""}</span>
            </div>
            {resultado.conError.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>{resultado.conError.length} con error</span>
              </div>
            )}
          </div>

          {/* Errores */}
          {resultado.conError.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-2">
              <p className="text-sm font-medium text-yellow-800">Filas con error (no se importarán):</p>
              {resultado.conError.map((f) => (
                <p key={f.fila} className="text-xs text-yellow-700">
                  Fila {f.fila}: {f.error}
                </p>
              ))}
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
                  ...y {resultado.correctas.length - 10} fila{resultado.correctas.length - 10 !== 1 ? "s" : ""} más
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
