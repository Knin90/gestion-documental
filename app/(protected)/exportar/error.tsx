"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorExportar({ reset }: { reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Error al exportar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No se pudo cargar la página de exportación. Intenta de nuevo.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
