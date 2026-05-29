"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearDocumento } from "@/app/actions/documents";

export default function NuevoDocumentoPage() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const resultado = await crearDocumento(formData);

    if (resultado.success) {
      toast.success("Documento creado correctamente");
      router.push(`/documentos/${resultado.id}`);
    } else {
      setError(resultado.error ?? "Error al crear el documento");
      setCargando(false);
    }
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
                  defaultChecked={tipo === "recibido"}
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
            placeholder="Opcional"
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
            placeholder="Describe el contenido del documento"
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
            placeholder="Nombre de quien firma"
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
            placeholder="A quién está dirigido"
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
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
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
