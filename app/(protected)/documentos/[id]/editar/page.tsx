"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { actualizarDocumento } from "@/app/actions/documents";
import { createClient } from "@/lib/supabase/client";
import { FileUp } from "lucide-react";

type TipoDocumento = "recibido" | "enviado";

interface DocumentoData {
  id: string;
  type: TipoDocumento;
  document_id: string | null;
  description: string;
  signed_by: string | null;
  addressed_to: string | null;
  document_date: string;
  pdf_url: string | null;
  pdf_filename: string | null;
}

export default function EditarDocumentoPage() {
  const [doc, setDoc] = useState<DocumentoData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    async function cargarDocumento() {
      const supabase = createClient();
      const { data } = await supabase
        .from("documents")
        .select("id, type, document_id, description, signed_by, addressed_to, document_date, pdf_url, pdf_filename")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (!data) {
        router.push("/documentos");
        return;
      }
      setDoc(data as DocumentoData);
      setCargando(false);
    }
    cargarDocumento();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    if (archivoPdf) {
      formData.set("pdf", archivoPdf);
    }

    const resultado = await actualizarDocumento(id, formData);

    if (resultado.success) {
      toast.success("Documento actualizado correctamente");
      router.push(`/documentos/${id}`);
    } else {
      setError(resultado.error ?? "Error al actualizar el documento");
      setGuardando(false);
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

  if (cargando) {
    return (
      <div className="p-6 max-w-2xl space-y-5 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Editar documento</h1>
        <p className="text-sm text-muted-foreground">
          Modifica los campos que necesites
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo */}
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
                  defaultChecked={doc.type === tipo}
                  className="accent-sidebar-primary"
                />
                <span className="text-sm capitalize">{tipo}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Identificador */}
        <div className="space-y-2">
          <label htmlFor="document_id" className="text-sm font-medium">
            Identificador
          </label>
          <input
            id="document_id"
            name="document_id"
            type="text"
            defaultValue={doc.document_id ?? ""}
            maxLength={100}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        {/* Descripción */}
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
            defaultValue={doc.description}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary resize-none"
          />
        </div>

        {/* Firmante */}
        <div className="space-y-2">
          <label htmlFor="signed_by" className="text-sm font-medium">
            Firmante
          </label>
          <input
            id="signed_by"
            name="signed_by"
            type="text"
            defaultValue={doc.signed_by ?? ""}
            maxLength={200}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        {/* Destinatario */}
        <div className="space-y-2">
          <label htmlFor="addressed_to" className="text-sm font-medium">
            Destinatario
          </label>
          <input
            id="addressed_to"
            name="addressed_to"
            type="text"
            defaultValue={doc.addressed_to ?? ""}
            maxLength={200}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <label htmlFor="document_date" className="text-sm font-medium">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            id="document_date"
            name="document_date"
            type="date"
            required
            defaultValue={doc.document_date}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        {/* PDF */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Archivo PDF</label>
          {doc.pdf_url && !archivoPdf && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              PDF actual: {doc.pdf_filename ?? "archivo.pdf"}
            </div>
          )}
          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-muted/30 transition-colors">
            <FileUp className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">
              {archivoPdf
                ? archivoPdf.name
                : doc.pdf_url
                  ? "Click para reemplazar PDF"
                  : "Click para adjuntar PDF"}
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
              Cancelar cambio de PDF
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={guardando}
            className="rounded-lg border px-6 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
