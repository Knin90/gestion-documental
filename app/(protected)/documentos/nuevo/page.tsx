"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearDocumento } from "@/app/actions/documents";
import { FileUp } from "lucide-react";

export default function NuevoDocumentoPage() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (archivoPdf) {
      formData.set("pdf", archivoPdf);
    }
    const resultado = await crearDocumento(formData);

    if (resultado.success) {
      toast.success("Documento creado correctamente");
      router.push(`/documentos/${resultado.id}`);
    } else {
      setError(resultado.error ?? "Error al crear el documento");
      setCargando(false);
    }
  }

  function handlePdfSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("El PDF no puede superar 15 MB");
      return;
    }
    setArchivoPdf(file);
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Nuevo documento</h1>
        <p className="text-sm text-muted-foreground">
          Completa los campos para registrar un documento
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Tipo <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            {(["recibido", "enviado"] as const).map((tipo) => (
              <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={tipo}
                  defaultChecked={tipo === "recibido"}
                  className="accent-sidebar-primary"
                />
                <span className="text-sm capitalize">{tipo}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="document_id" className="text-sm font-medium">
            Identificador
          </label>
          <input
            id="document_id"
            name="document_id"
            type="text"
            placeholder="Opcional"
            maxLength={100}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            maxLength={500}
            rows={3}
            placeholder="Describe el contenido del documento"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary resize-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="signed_by" className="text-sm font-medium">
            Firmante
          </label>
          <input
            id="signed_by"
            name="signed_by"
            type="text"
            placeholder="Nombre de quien firma"
            maxLength={200}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="addressed_to" className="text-sm font-medium">
            Destinatario
          </label>
          <input
            id="addressed_to"
            name="addressed_to"
            type="text"
            placeholder="A quién está dirigido"
            maxLength={200}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="document_date" className="text-sm font-medium">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            id="document_date"
            name="document_date"
            type="date"
            required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        {/* PDF */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Archivo PDF (opcional)</label>
          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-muted/30 transition-colors">
            <FileUp className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">
              {archivoPdf ? archivoPdf.name : "Click para adjuntar PDF"}
            </span>
            {archivoPdf && (
              <span className="text-xs text-muted-foreground mt-1">
                {(archivoPdf.size / 1024).toFixed(1)} KB
              </span>
            )}
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfSeleccionado}
              className="hidden"
            />
          </label>
          {archivoPdf && (
            <button
              type="button"
              onClick={() => setArchivoPdf(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Quitar PDF
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={cargando}
            className="rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {cargando ? "Guardando..." : "Guardar documento"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={cargando}
            className="rounded-lg border px-6 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
