import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FilePlus, FileWarning } from "lucide-react";
import { SelectorTipoDashboard } from "@/components/domain/selector-tipo-dashboard";
import { EliminarTodosBoton } from "@/components/domain/eliminar-todos-boton";
import { EliminarDocumentoBoton } from "@/components/domain/eliminar-documento-boton";

type TipoDocumento = "recibido" | "enviado";

interface PageProps {
  searchParams: Promise<{ tipo?: string; solo_pendientes?: string; q?: string; pagina?: string }>;
}

const DOCUMENTOS_POR_PAGINA = 20;

export default async function DocumentosPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Obtener org_id, permission y role del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, permission, role")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) redirect("/login");
  const orgId = profile.org_id;
  const puedeEditar = profile.role === "admin" || profile.permission === "editor";
  
  // Control de permisos: admin o editor pueden modificar, viewer solo lectura

  const params = await searchParams;
  const tipo: TipoDocumento = params.tipo === "enviado" ? "enviado" : "recibido";
  const soloPendientes = params.solo_pendientes === "1";
  const busqueda = params.q?.trim() ?? "";
  const pagina = Math.max(1, parseInt(params.pagina ?? "1"));
  const desde = (pagina - 1) * DOCUMENTOS_POR_PAGINA;

  let query = supabase
    .from("documents")
    .select("id, document_id, description, signed_by, addressed_to, document_date, pdf_url", { count: "exact" })
    .eq("type", tipo)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("document_date", { ascending: false })
    .range(desde, desde + DOCUMENTOS_POR_PAGINA - 1);

  if (soloPendientes) query = query.is("pdf_url", null);
  if (busqueda) query = query.ilike("document_id", `%${busqueda}%`);

  const { data: documentos, count } = await query;
  const totalPaginas = Math.ceil((count ?? 0) / DOCUMENTOS_POR_PAGINA);
  const etiquetaTipo = tipo === "recibido" ? "Recibidos" : "Enviados";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            {count ?? 0} documento{(count ?? 0) !== 1 ? "s" : ""} {etiquetaTipo.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SelectorTipoDashboard tipoActual={tipo} />
          {puedeEditar && (
            <Link
              href="/documentos/nuevo"
              className="flex items-center gap-2 rounded-lg bg-sidebar-primary px-4 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity"
            >
              <FilePlus className="h-4 w-4" />
              Nuevo
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form method="GET" className="flex-1">
          <input type="hidden" name="tipo" value={tipo} />
          {soloPendientes && <input type="hidden" name="solo_pendientes" value="1" />}
          <input
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por N° Nota..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </form>
        <Link
          href={`/documentos?tipo=${tipo}${soloPendientes ? "" : "&solo_pendientes=1"}`}
          className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            soloPendientes
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "bg-background text-foreground hover:bg-muted"
          }`}
        >
          Solo pendientes de PDF
        </Link>
        {puedeEditar && <EliminarTodosBoton tipo={tipo} total={count ?? 0} />}
      </div>

      {!documentos || documentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 gap-3">
          <FileWarning className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No hay documentos para mostrar</p>
          {puedeEditar && (
            <Link href="/documentos/nuevo" className="text-sm font-medium text-sidebar-primary hover:underline">
              Crear el primero
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-xl border overflow-hidden" style={{borderColor: 'var(--border)'}}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{backgroundColor: 'var(--table-header)'}}>
                  <th className="px-4 py-3 text-left font-semibold" style={{color: 'var(--table-header-foreground)'}}>ID</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{color: 'var(--table-header-foreground)'}}>Descripción</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{color: 'var(--table-header-foreground)'}}>Procedencia</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{color: 'var(--table-header-foreground)'}}>Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{color: 'var(--table-header-foreground)'}}>PDF</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{color: 'var(--table-header-foreground)'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc, index) => (
                  <tr
                    key={doc.id}
                    style={{backgroundColor: index % 2 === 0 ? 'var(--table-row-a)' : 'var(--table-row-b)'}}
                    className="transition-colors hover:opacity-80"
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{color: 'var(--muted-foreground)'}}>
                      {doc.document_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs" style={{color: 'var(--card-foreground)'}}>
                      <span className="line-clamp-2">{doc.description}</span>
                    </td>
                    <td className="px-4 py-3" style={{color: 'var(--muted-foreground)'}}>
                      {doc.signed_by ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{color: 'var(--muted-foreground)'}}>
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
                          PDF
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/documentos/${doc.id}`} className="rounded px-2 py-1 text-xs font-medium hover:bg-muted transition-colors" style={{color: 'var(--sidebar-primary)'}}>
                          Ver
                        </Link>
                        {puedeEditar && (
                          <>
                            <Link href={`/documentos/${doc.id}/editar`} className="rounded px-2 py-1 text-xs font-medium hover:bg-muted transition-colors" style={{color: 'var(--foreground)'}}>
                              Editar
                            </Link>
                            <EliminarDocumentoBoton id={doc.id} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="grid gap-3 md:hidden">
            {documentos.map((doc, index) => (
              <div
                key={doc.id}
                className="rounded-xl border p-4 space-y-2"
                style={{backgroundColor: index % 2 === 0 ? 'var(--table-row-a)' : 'var(--table-row-b)', borderColor: 'var(--border)'}}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium line-clamp-2" style={{color: 'var(--card-foreground)'}}>{doc.description}</span>
                  {doc.pdf_url ? (
                    <span className="shrink-0 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">PDF</span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Pendiente</span>
                  )}
                </div>
                {doc.document_id && (
                  <p className="text-xs font-mono" style={{color: 'var(--muted-foreground)'}}>ID: {doc.document_id}</p>
                )}
                {doc.signed_by && (
                  <p className="text-xs" style={{color: 'var(--muted-foreground)'}}>Firmante: {doc.signed_by}</p>
                )}
                <p className="text-xs" style={{color: 'var(--muted-foreground)'}}>
                  {doc.document_date
                    ? new Date(doc.document_date + "T00:00:00").toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/documentos/${doc.id}`} className="rounded px-3 py-1 text-xs font-medium border hover:bg-muted transition-colors" style={{color: 'var(--sidebar-primary)'}}>Ver</Link>
                  {puedeEditar && (
                    <>
                      <Link href={`/documentos/${doc.id}/editar`} className="rounded px-3 py-1 text-xs font-medium border hover:bg-muted transition-colors">Editar</Link>
                      <EliminarDocumentoBoton id={doc.id} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</p>
              <div className="flex gap-2">
                {pagina > 1 && (
                  <Link href={`/documentos?tipo=${tipo}&pagina=${pagina - 1}${soloPendientes ? "&solo_pendientes=1" : ""}${busqueda ? `&q=${busqueda}` : ""}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                    Anterior
                  </Link>
                )}
                {pagina < totalPaginas && (
                  <Link href={`/documentos?tipo=${tipo}&pagina=${pagina + 1}${soloPendientes ? "&solo_pendientes=1" : ""}${busqueda ? `&q=${busqueda}` : ""}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
