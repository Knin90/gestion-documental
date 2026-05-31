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

function completarMeses(datos: { mes: string; total: number }[]) {
  const NOMBRES_MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const ahora = new Date();
  const resultado: { mes: string; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const encontrado = datos.find((d) => d.mes === clave);
    resultado.push({ mes: NOMBRES_MESES[fecha.getMonth()], total: encontrado?.total ?? 0 });
  }
  return resultado;
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

  // Obtener org_id del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) redirect("/login");
  const orgId = profile.org_id;

  const params = await searchParams;
  const tipo: TipoDocumento = params.tipo === "enviado" ? "enviado" : "recibido";

  const { data: stats, error } = await supabase.rpc("get_dashboard_stats", {
    tipo_doc: tipo,
    org_id_param: orgId,
  });

  const datos = error || !stats
    ? { total: 0, totalEsteMes: 0, totalEsteAnio: 0, pendientesPdf: 0, topFirmantes: [], topDestinatarios: [], porMes: [], porAnio: [] }
    : stats;

  const etiquetaTipo = tipo === "recibido" ? "Recibidos" : "Enviados";
  const datosPorMes = completarMeses(datos.porMes ?? []);
  const datosPorAnio = (datos.porAnio ?? []).map((d: { anio: string; total: number }) => ({ anio: d.anio, total: d.total }));

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
        <TarjetaTotal titulo="Total de documentos" valor={datos.total ?? 0} icono={FileText} descripcion={etiquetaTipo} />
        <TarjetaTotal titulo="Este mes" valor={datos.totalEsteMes ?? 0} icono={CalendarDays} descripcion="Mes en curso" />
        <TarjetaTotal titulo="Este año" valor={datos.totalEsteAnio ?? 0} icono={CalendarRange} descripcion="Año en curso" />
        <TarjetaTotal titulo="Pendientes de PDF" valor={datos.pendientesPdf ?? 0} icono={Clock} descripcion="Sin archivo adjunto" />
      </div>

      <DashboardCharts datosPorMes={datosPorMes} datosPorAnio={datosPorAnio} />

      <div className="grid gap-6 md:grid-cols-2">
        <TopLista titulo="Top 5 firmantes" items={datos.topFirmantes ?? []} sinDatosTexto="Sin firmantes registrados" />
        <TopLista titulo="Top 5 destinatarios" items={datos.topDestinatarios ?? []} sinDatosTexto="Sin destinatarios registrados" />
      </div>
    </div>
  );
}
