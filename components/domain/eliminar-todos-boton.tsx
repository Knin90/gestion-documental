"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { eliminarTodosDocumentos } from "@/app/actions/documents";

interface EliminarTodosBotonProps {
  tipo: "recibido" | "enviado";
  total: number;
}

export function EliminarTodosBoton({ tipo, total }: EliminarTodosBotonProps) {
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();
  const etiqueta = tipo === "recibido" ? "recibidos" : "enviados";

  async function handleEliminar() {
    setCargando(true);
    const resultado = await eliminarTodosDocumentos(tipo);
    if (resultado.success) {
      toast.success(`${total} documento${total !== 1 ? "s" : ""} ${etiqueta} eliminado${total !== 1 ? "s" : ""}`);
      router.refresh();
    } else {
      toast.error(resultado.error ?? "Error al eliminar");
    }
    setCargando(false);
    setPaso(0);
  }

  if (total === 0) return null;

  if (paso === 0) {
    return (
      <button
        onClick={() => setPaso(1)}
        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Eliminar todos
      </button>
    );
  }

  if (paso === 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2">
        <span className="text-xs text-red-700">
          ¿Eliminar {total} documento{total !== 1 ? "s" : ""} {etiqueta}?
        </span>
        <button
          onClick={() => setPaso(2)}
          className="rounded px-2 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Sí, continuar
        </button>
        <button
          onClick={() => setPaso(0)}
          className="rounded px-2 py-1 text-xs font-medium hover:bg-red-100 transition-colors text-red-700"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-400 bg-red-100 px-3 py-2">
      <span className="text-xs font-medium text-red-800">
        Esta acción no se puede deshacer. ¿Confirmar?
      </span>
      <button
        onClick={handleEliminar}
        disabled={cargando}
        className="rounded px-2 py-1 text-xs font-medium bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
      >
        {cargando ? "Eliminando..." : "Confirmar eliminación"}
      </button>
      <button
        onClick={() => setPaso(0)}
        disabled={cargando}
        className="rounded px-2 py-1 text-xs font-medium hover:bg-red-200 transition-colors text-red-800"
      >
        Cancelar
      </button>
    </div>
  );
}
