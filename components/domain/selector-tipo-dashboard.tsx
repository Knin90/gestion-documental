"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useOptimistic } from "react";

type TipoDocumento = "recibido" | "enviado";

interface SelectorTipoDashboardProps {
  tipoActual: TipoDocumento;
}

export function SelectorTipoDashboard({ tipoActual }: SelectorTipoDashboardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticTipo, setOptimisticTipo] = useOptimistic(tipoActual);

  function handleClick(tipo: TipoDocumento) {
    if (tipo === optimisticTipo) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tipo", tipo);
    params.delete("pagina");
    setOptimisticTipo(tipo);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex rounded-lg border bg-muted p-1 text-sm">
      {(["recibido", "enviado"] as const).map((tipo) => (
        <button
          key={tipo}
          onClick={() => handleClick(tipo)}
          className={
            optimisticTipo === tipo
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
