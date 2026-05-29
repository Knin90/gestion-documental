"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DatoMes {
  mes: string;
  total: number;
}

interface DatoAnio {
  anio: string;
  total: number;
}

interface DashboardChartsProps {
  datosPorMes: DatoMes[];
  datosPorAnio: DatoAnio[];
}

const estiloTooltip = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--card-foreground))",
  fontSize: "12px",
};

export function DashboardCharts({ datosPorMes, datosPorAnio }: DashboardChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          Documentos por mes (últimos 12 meses)
        </h3>
        {datosPorMes.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Sin datos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={datosPorMes} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={estiloTooltip} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Documentos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          Documentos por año
        </h3>
        {datosPorAnio.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Sin datos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={datosPorAnio} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="anio"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={estiloTooltip} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Documentos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
