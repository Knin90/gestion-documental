import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, FileWarning, ArrowUpDown } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    identificador?: string;
    dia?: string;
    mes?: string;
    anio?: string;
    tipo?: string;
    orden?: string;
  }>;
}

const MESES = [
  { valor: "01", nombre: "Enero", dias: 31 },
  { valor: "02", nombre: "Febrero", dias: 29 },
  { valor: "03", nombre: "Marzo", dias: 31 },
  { valor: "04", nombre: "Abril", dias: 30 },
  { valor: "05", nombre: "Mayo", dias: 31 },
  { valor: "06", nombre: "Junio", dias: 30 },
  { valor: "07", nombre: "Julio", dias: 31 },
  { valor: "08", nombre: "Agosto", dias: 31 },
  { valor: "09", nombre: "Septiembre", dias: 30 },
  { valor: "10", nombre: "Octubre", dias: 31 },
  { valor: "11", nombre: "Noviembre", dias: 30 },
  { valor: "12", nombre: "Diciembre", dias: 31 },
];

const anioActual = new Date().getFullYear();
const ANIOS = Array.from({ length: 10 }, (_, i) => anioActual - i);
const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);

export default async function BuscarPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const identificador = params.identificador?.trim() ?? "";
  const dia = params.dia ?? "";
  const mes = params.mes ?? "";
  const anio = params.anio ?? "";
  const tipo = params.tipo ?? "";
  const orden = params.orden === "asc" ? "asc" : "desc";

  const hayBusqueda = identificador || dia || mes || anio;

  let documentos: any[] = [];
  let errorBusqueda = false;

  if (hayBusqueda) {
    let query = supabase
      .from("documents")
      .select("id, document_id, description, type, document_date, pdf_url, signed_by")
      .is("deleted_at", null)
      .order("document_date", { ascending: orden === "asc" });

    if (tipo === "recibido" || tipo === "enviado") {
      query = query.eq("type", tipo);
    }

    if (identificador) {
      query = query.ilike("document_id", `%${identificador}%`);
    }

    if (dia && mes && anio) {
      const fecha = `${anio}-${mes}-${dia.padStart(2, "0")}`;
      query = query.eq("document_date", fecha);
    } else if (mes && anio) {
      const ultimoDia = new Date(parseInt(anio), parseInt(mes), 0).getDate();
      query = query
        .gte("document_date", `${anio}-${mes}-01`)
        .lte("document_date", `${anio}-${mes}-${String(ultimoDia).padStart(2, "0")}`);
    } else if (mes) {
      const a = anioActual;
      const ultimoDia = new Date(a, parseInt(mes), 0).getDate();
      query = query
        .gte("document_date", `${a}-${mes}-01`)
        .lte("document_date", `${a}-${mes}-${String(ultimoDia).padStart(2, "0")}`);
    } else if (anio) {
      query = query
        .gte("document_date", `${anio}-01-01`)
        .lte("document_date", `${anio}-12-31`);
    } else if (dia) {
      // Solo día sin mes/año — no tiene sentido, ignorar
    }

    const { data, error } = await query;
    if (error) {
      errorBusqueda = true;
      console.error("Error en búsqueda:", error.message);
    } else {
      documentos = data ?? [];
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buscar documentos</h1>
        <p className="text-sm text-muted-foreground">
          Busca por identificador, fecha o tipo
        </p>
      </div>

      <form method="GET" className="rounded-xl border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="identificador" className="text-sm font-medium">
              Identificador
            </label>
            <input
              id="identificador"
              name="identificador"
              type="text"
              defaultValue={identificador}
              placeholder="Buscar por ID del documento"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tipo" className="text-sm font-medium">
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={tipo}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            >
              <option value="">Todos</option>
              <option value="recibido">Recibidos</option>
              <option value="enviado">Enviados</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="anio" className="text-sm font-medium">
              Año
            </label>
            <select
              id="anio"
              name="anio"
              defaultValue={anio}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            >
              <option value="">Todos</option>
              {ANIOS.map((a) => (
                <option key={a} value={String(a)}>{a}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="mes" className="text-sm font-medium">
              Mes
            </label>
            <select
              id="mes"
              name="mes"
              defaultValue={mes}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            >
              <option value="">Todos</option>
              {MESES.map((m) => (
                <option key={m.valor} value={m.valor}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="dia" className="text-sm font-medium">
              Día
            </label>
            <select
              id="dia"
              name="dia"
              defaultValue={dia}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            >
              <option value="">Todos</option>
              {DIAS.map((d) => (
                <option key={d} value={String(d)}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="orden" className="text-sm font-medium">
              Orden
            </label>
            <select
              id="orden"
              name="orden"
              defaultValue={orden}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            >
              <option value="desc">Más reciente primero</option>
              <option value="asc">Más antiguo primero</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-sidebar-primary px-5 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
          <Link
            href="/buscar"
            className="rounded-lg border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Limpiar
          </Link>
        </div>
      </form>

      {errorBusqueda && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error al realizar la búsqueda. Intenta de nuevo.
        </div>
      )}

      {hayBusqueda && !errorBusqueda && (
        <>
          <p className="text-sm text-muted-foreground">
            {documentos.length === 0
              ? "Sin resultados para esta búsqueda"
              : `${documentos.length} resultado${documentos.length !== 1 ? "s" : ""} encontrado${documentos.length !== 1 ? "s" : ""} — ${orden === "desc" ? "más reciente primero" : "más antiguo primero"}`}
          </p>

          {documentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 gap-3">
              <FileWarning className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No se encontraron documentos</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">PDF</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {documentos.map((doc) => (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {doc.document_id ?? "—"}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="line-clamp-2">{doc.description}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            doc.type === "recibido"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}>
                            {doc.type === "recibido" ? "Recibido" : "Enviado"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {doc.document_date
                            ? new Date(doc.document_date + "T00:00:00").toLocaleDateString("es", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {doc.pdf_url ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Con PDF
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/documentos/${doc.id}`}
                            className="rounded px-2 py-1 text-xs font-medium hover:bg-muted transition-colors"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {documentos.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documentos/${doc.id}`}
                    className="rounded-xl border bg-card p-4 space-y-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium line-clamp-2">{doc.description}</span>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        doc.type === "recibido"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {doc.type === "recibido" ? "Rec" : "Env"}
                      </span>
                    </div>
                    {doc.document_id && (
                      <p className="text-xs text-muted-foreground font-mono">ID: {doc.document_id}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {doc.document_date
                          ? new Date(doc.document_date + "T00:00:00").toLocaleDateString("es", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                      {doc.pdf_url ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          PDF
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
