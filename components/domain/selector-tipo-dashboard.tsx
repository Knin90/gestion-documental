"use client";

import { useRouter, usePathname } from "next/navigation";

type TipoDocumento = "recibido" | "enviado";

interface SelectorTipoDashboardProps {
  tipoActual: TipoDocumento;
}

export function SelectorTipoDashboard({ tipoActual }: SelectorTipoDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleCambio(tipo: TipoDocumento) {
    router.push(`${pathname}?tipo=${tipo}`);
  }

  return (
    <div className="flex rounded-lg border bg-muted p-1 text-sm">
      {(["recibido", "enviado"] as const).map((tipo) => (
        <button
          key={tipo}
          onClick={() => handleCambio(tipo)}
          className={
            tipoActual === tipo
              ? "rounded-md bg-background px-4 py-1.5 font-medium shadow-sm transition-all"
              : "rounded-md px-4 py-1.5 text-muted-foreground transition-all hover:text-foreground"
          }
        >
          {tipo === "recibido" ? "Recibidos" : "Enviados"}
        </button>
      ))}
    </div>
  );
}
