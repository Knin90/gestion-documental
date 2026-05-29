import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileText, CalendarDays, CalendarRange, Clock } from "lucide-react";
import { DashboardCharts } from "@/components/domain/dashboard-charts";
import { SelectorTipoDashboard } from "@/components/domain/selector-tipo-dashboard";

type TipoDocumento = "recibido" | "enviado";

interface PageProps {
  searchParams: Promise<{ tipo?: string }>;
}

interface TarjetaTotalProps {
  titulo: string;
  valor: number;
  icono: React.ComponentType<{ className?: string }>;
  descripcion?: string;
}

function TarjetaTotal({ titulo, valor, icono: Icono, descripcion }: TarjetaTotalProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        <Icono className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">
        {valor.toLocaleString("es")}
      </p>
      {descripcion && (
        <p className="mt-1 text-xs text-muted-foreground">{descripcion}</p>
      )}
    </div>
  );
}

function calcularDatosPorMes(docs: { document_date: string | null }[]) {
  const NOMBRES_MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const ahora = new Date();
  const resultado: { mes: string; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const total = docs.filter((d) => d.document_date?.startsWith(clave)).length;
    resultado.push({ mes: NOMBRES_MESES[fecha.getMonth()], total });
  }
  return resultado;
}

function calcularDatosPorAnio(docs: { document_date: string | null }[]) {
  const conteo: Record<string, number> = {};
  for (const doc of docs) {
    if (!doc.document_date) continue;
    const anio = doc.document_date.substring(0, 4);
    conteo[anio] = (conteo[anio] ?? 0) + 1;
  }
  return Object.entries(conteo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([anio, total]) => ({ anio, total }));
}

function calcularTop5(docs: Record<string, string | null>[], campo: string) {
  const conteo: Record<string, number> = {};
  for (const doc of docs) {
    const valor = doc[campo];
    if (!valor) continue;
    conteo[valor] = (conteo[valor] ?? 0) + 1;
  }
  return Object.entries(conteo)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nombre, total]) => ({ nombre, total }));
}

async function obtenerDatosDashboard(tipo: TipoDocumento) {
  const supabase = await createClient();
  const ahora = new Date();
  const anioActual = ahora.getFullYear();

  const { count: total } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("type", tipo)
    .is("deleted_at", null);

  const inicioDeMes = new Date(anioActual, ahora.getMonth(), 1).toISOString();
  const { count: totalEsteMes } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("type", tipo)
    .is("deleted_at", null)
    .gte("document_date", inicioDeMes);

  const inicioDeAnio = new Date(anioActual, 0, 1).toISOString();
  const { count: totalEsteAnio } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("type", tipo)
    .is("deleted_at", null)
    .gte("document_date", inicioDeAnio);

  const { count: pendientesPdf } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("type", tipo)
    .is("deleted_at", null)
    .is("pdf_url", null);

  const { data: documentosRecientes } = await supabase
    .from("documents")
    .select("document_date")
    .eq("type", tipo)
    .is("deleted_at", null)
    .gte("document_date", new Date(anioActual - 1, ahora.getMonth(), 1).toISOString());

  const { data: todosDocumentos } = await supabase
    .from("documents")
    .select("document_date")
    .eq("type", tipo)
    .is("deleted_at", null);

  const { data: documentosConFirmante } = await supabase
    .from("documents")
    .select("signed_by")
    .eq("type", tipo)
    .is("deleted_at", null)
    .not("signed_by", "is", null);

  const { data: documentosConDestinatario } = await supabase
    .from("documents")
    .select("addressed_to")
    .eq("type", tipo)
    .is("deleted_at", null)
    .not("addressed_to", "is", null);

  return {
    total: total ?? 0,
    totalEsteMes: totalEsteMes ?? 0,
    totalEsteAnio: totalEsteAnio ?? 0,
    pendientesPdf: pendientesPdf ?? 0,
    datosPorMes: calcularDatosPorMes(documentosRecientes ?? []),
    datosPorAnio: calcularDatosPorAnio(todosDocumentos ?? []),
    topFirmantes: calcularTop5((documentosConFirmante ?? []) as Record<string, string | null>[], "signed_by"),
    topDestinatarios: calcularTop5((documentosConDestinatario ?? []) as Record<string, string | null>[], "addressed_to"),
  };
}

interface TopListaProps {
  titulo: string;
  items: { nombre: string; total: number }[];
  sinDatosTexto: string;
}

function TopLista({ titulo, items, sinDatosTexto }: TopListaProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-card-foreground">{titulo}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{sinDatosTexto}</p>
      ) : (
        <ol className="space-y-3">
          {items.map(({ nombre, total }, indice) => (
            <li key={nombre} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {indice + 1}
              </span>
              <span className="flex-1 truncate text-sm text-card-foreground">{nombre}</span>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">{total}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const tipo: TipoDocumento = params.tipo === "enviado" ? "enviado" : "recibido";
  const datos = await obtenerDatosDashboard(tipo);
  const etiquetaTipo = tipo === "recibido" ? "Recibidos" : "Enviados";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
          <p className="text-sm text-muted-foreground">
            Estadísticas de documentos {etiquetaTipo.toLowerCase()}
          </p>
        </div>
        <SelectorTipoDashboard tipoActual={tipo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaTotal titulo="Total de documentos" valor={datos.total} icono={FileText} descripcion={etiquetaTipo} />
        <TarjetaTotal titulo="Este mes" valor={datos.totalEsteMes} icono={CalendarDays} descripcion="Mes en curso" />
        <TarjetaTotal titulo="Este año" valor={datos.totalEsteAnio} icono={CalendarRange} descripcion="Año en curso" />
        <TarjetaTotal titulo="Pendientes de PDF" valor={datos.pendientesPdf} icono={Clock} descripcion="Sin archivo adjunto" />
      </div>

      <DashboardCharts datosPorMes={datos.datosPorMes} datosPorAnio={datos.datosPorAnio} />

      <div className="grid gap-6 md:grid-cols-2">
        <TopLista titulo="Top 5 firmantes" items={datos.topFirmantes} sinDatosTexto="Sin firmantes registrados" />
        <TopLista titulo="Top 5 destinatarios" items={datos.topDestinatarios} sinDatosTexto="Sin destinatarios registrados" />
      </div>
    </div>
  );
}
