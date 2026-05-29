import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Calendar, User, Send, Hash, HardDrive, FileDigit } from "lucide-react";
import { EliminarDocumentoBoton } from "@/components/domain/eliminar-documento-boton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalleDocumentoPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!doc) notFound();

  const fechaFormateada = doc.document_date
    ? new Date(doc.document_date + "T00:00:00").toLocaleDateString("es", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  const tamanioPdf = doc.pdf_size_bytes
    ? doc.pdf_size_bytes < 1024 * 1024
      ? `${(doc.pdf_size_bytes / 1024).toFixed(1)} KB`
      : `${(doc.pdf_size_bytes / (1024 * 1024)).toFixed(1)} MB`
    : null;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              doc.type === "recibido"
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800"
            }`}>
              {doc.type === "recibido" ? "Recibido" : "Enviado"}
            </span>
            {!doc.pdf_url && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                Pendiente de PDF
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight">{doc.description}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/documentos/${doc.id}/editar`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Editar
          </Link>
          <EliminarDocumentoBoton id={doc.id} redirectTo="/documentos" />
        </div>
      </div>

      <div className="rounded-xl border bg-card divide-y">
        <CampoDetalle icono={Hash} label="Identificador" valor={doc.document_id ?? "—"} />
        <CampoDetalle icono={Calendar} label="Fecha" valor={fechaFormateada} />
        <CampoDetalle icono={User} label="Firmante" valor={doc.signed_by ?? "—"} />
        <CampoDetalle icono={Send} label="Destinatario" valor={doc.addressed_to ?? "—"} />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Archivo PDF
        </h2>
        {doc.pdf_url ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {doc.pdf_filename && (
                <span className="flex items-center gap-1.5">
                  <FileDigit className="h-3.5 w-3.5" />
                  {doc.pdf_filename}
                </span>
              )}
              {tamanioPdf && (
                <span className="flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5" />
                  {tamanioPdf}
                </span>
              )}
              {doc.pdf_pages && (
                <span>{doc.pdf_pages} página{doc.pdf_pages !== 1 ? "s" : ""}</span>
              )}
            </div>
            
              href={doc.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-sidebar-primary px-4 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity"
            >
              <FileText className="h-4 w-4" />
              Ver PDF
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Este documento no tiene PDF adjunto.
            </p>
            <Link
              href={`/documentos/${doc.id}/editar`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors w-fit"
            >
              Adjuntar PDF
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Metadatos</h2>
        <p className="text-xs text-muted-foreground">
          Creado: {new Date(doc.created_at).toLocaleString("es")}
        </p>
        {doc.updated_at && doc.updated_at !== doc.created_at && (
          <p className="text-xs text-muted-foreground">
            Actualizado: {new Date(doc.updated_at).toLocaleString("es")}
          </p>
        )}
      </div>

      <Link
        href={`/documentos?tipo=${doc.type}`}
        className="inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Volver al listado
      </Link>
    </div>
  );
}

interface CampoDetalleProps {
  icono: React.ComponentType<{ className?: string }>;
  label: string;
  valor: string;
}

function CampoDetalle({ icono: Icono, label, valor }: CampoDetalleProps) {
  return (
    <div className="flex items-start gap-4 px-6 py-4">
      <Icono className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="space-y-0.5 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm text-card-foreground break-words">{valor}</p>
      </div>
    </div>
  );
}
