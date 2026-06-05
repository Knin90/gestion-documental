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

// Colores según tema
function useThemeColors() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark
    ? {
        barColor: "#BD93F9",       // Dracula purple
        barColor2: "#8BE9FD",      // Dracula cyan
        gridColor: "#44475A",      // Dracula selection
        tickColor: "#6272A4",      // Dracula comment
        tooltipBg: "#282A36",      // Dracula background
        tooltipBorder: "#44475A",
        tooltipColor: "#F8F8F2",
        cursorFill: "#44475A",
      }
    : {
        barColor: "#4a8a00",
        barColor2: "#6aaa00",
        gridColor: "#cce8a0",
        tickColor: "#5a7a3a",
        tooltipBg: "#ffffff",
        tooltipBorder: "#cce8a0",
        tooltipColor: "#1a2a0a",
        cursorFill: "#e8f5cc",
      };
}

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
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: colors.tickColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.tickColor }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={estiloTooltip} cursor={{ fill: colors.cursorFill }} />
              <Bar dataKey="total" fill={colors.barColor} radius={[4, 4, 0, 0]} name="Documentos" />
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
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
              <XAxis
                dataKey="anio"
                tick={{ fontSize: 11, fill: colors.tickColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.tickColor }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={estiloTooltip} cursor={{ fill: colors.cursorFill }} />
              <Bar dataKey="total" fill={colors.barColor} radius={[4, 4, 0, 0]} name="Documentos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
