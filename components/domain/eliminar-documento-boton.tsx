"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eliminarDocumento } from "@/app/actions/documents";

interface EliminarDocumentoBotonProps {
  id: string;
  redirectTo?: string;
}

export function EliminarDocumentoBoton({ id, redirectTo }: EliminarDocumentoBotonProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function handleEliminar() {
    setCargando(true);
    const resultado = await eliminarDocumento(id);
    if (resultado.success) {
      toast.success("Documento eliminado");
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } else {
      toast.error(resultado.error ?? "Error al eliminar");
      setCargando(false);
      setConfirmando(false);
    }
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleEliminar}
          disabled={cargando}
          className="rounded px-2 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {cargando ? "..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          disabled={cargando}
          className="rounded px-2 py-1 text-xs font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
    >
      Eliminar
    </button>
  );
}
