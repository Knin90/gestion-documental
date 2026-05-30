"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet } from "lucide-react";
import { obtenerDocumentosParaExportar } from "@/app/actions/import-export";

type TipoDocumento = "recibido" | "enviado";

export default function ExportarPage() {
  const [tipo, setTipo] = useState<TipoDocumento>("recibido");
  const [exportando, setExportando] = useState(false);

  async function handleExportar() {
    setExportando(true);

    try {
      const res = await obtenerDocumentosParaExportar(tipo);

      if (!res.success || res.documentos.length === 0) {
        toast.error(res.documentos.length === 0 ? "No hay documentos para exportar" : res.error);
        setExportando(false);
        return;
      }

      const { utils, writeFile } = await import("xlsx");

      const filas = res.documentos.map((doc) => ({
        "Identificador": doc.document_id ?? "",
        "Descripción": doc.description,
        "Firmante": doc.signed_by ?? "",
        "Destinatario": doc.addressed_to ?? "",
        "Fecha": doc.document_date
          ? new Date(doc.document_date + "T00:00:00").toLocaleDateString("es", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "",
        "Estado PDF": doc.pdf_url ? "Con PDF" : "Pendiente",
      }));

      const hoja = utils.json_to_sheet(filas);

      // Ajustar ancho de columnas
      hoja["!cols"] = [
        { wch: 15 },
        { wch: 50 },
        { wch: 25 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
      ];

      const libro = utils.book_new();
      utils.book_append_sheet(libro, hoja, tipo === "recibido" ? "Recibidos" : "Enviados");

      const fecha = new Date().toISOString().split("T")[0];
      const nombreArchivo = `documentos_${tipo}s_${fecha}.xlsx`;
      writeFile(libro, nombreArchivo);

      toast.success(`${res.documentos.length} documento${res.documentos.length !== 1 ? "s" : ""} exportado${res.documentos.length !== 1 ? "s" : ""}`);
    } catch (err) {
      toast.error("Error al generar el archivo Excel");
      console.error("Error exportando:", err);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exportar a Excel</h1>
        <p className="text-sm text-muted-foreground">
          Descarga los documentos en formato .xlsx
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="space-y-3">
          <label className="text-sm font-medium">Tipo de documentos</label>
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

        <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>El archivo incluirá: Identificador, Descripción, Firmante, Destinatario, Fecha y Estado PDF.</p>
            <p>Solo se exportan documentos del tipo seleccionado (nunca mezclados).</p>
          </div>
        </div>

        <button
          onClick={handleExportar}
          disabled={exportando}
          className="flex items-center gap-2 rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exportando ? "Exportando..." : "Descargar Excel"}
        </button>
      </div>
    </div>
  );
}
