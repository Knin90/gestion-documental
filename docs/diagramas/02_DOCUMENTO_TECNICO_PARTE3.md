# Documento Técnico — Parte 3: Código, GitHub y Testing

---

## 8. Desarrollo del Código

### 8.1 Orden de implementación

El código se desarrolló siguiendo el orden de los hitos, priorizando la funcionalidad base antes que los detalles visuales.

```
Semana 1-2:   Schema SQL + RLS + funciones PostgreSQL
Semana 2-3:   Autenticación (Hito 1)
Semana 3-4:   Layout + Dashboard (Hito 2)
Semana 4-5:   CRUD Documentos (Hito 3)
Semana 5-6:   Búsqueda + Import/Export (Hito 4)
Semana 6-7:   Gestión Usuarios + Notificaciones
Semana 7+:    Seguridad + UI refinements + Documentación
```

### 8.2 Base de datos — Schema principal

```sql
-- Tipos enumerados
CREATE TYPE document_type AS ENUM ('recibido', 'enviado');

-- Organizaciones
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Perfiles de usuario
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  role text DEFAULT 'user',
  permission text DEFAULT 'editor',
  is_owner boolean DEFAULT false,
  org_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

-- Documentos
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type document_type NOT NULL,
  document_id text,
  description text NOT NULL,
  signed_by text,
  addressed_to text,
  document_date date NOT NULL,
  pdf_url text,
  pdf_filename text,
  pdf_size_bytes bigint,
  org_id uuid REFERENCES organizations(id) NOT NULL,
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
```

### 8.3 Función principal de estadísticas

```sql
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  tipo_doc document_type,
  org_id_param uuid
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'totalEsteMes', COUNT(*) FILTER (
      WHERE EXTRACT(MONTH FROM document_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM document_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ),
    'totalEsteAnio', COUNT(*) FILTER (
      WHERE EXTRACT(YEAR FROM document_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ),
    'pendientesPdf', COUNT(*) FILTER (WHERE pdf_url IS NULL),
    'porMes', (
      SELECT json_agg(json_build_object('mes', mes, 'total', total))
      FROM (
        SELECT TO_CHAR(document_date, 'YYYY-MM') as mes, COUNT(*) as total
        FROM documents
        WHERE type = tipo_doc AND org_id = org_id_param AND deleted_at IS NULL
        GROUP BY mes ORDER BY mes
      ) m
    ),
    'topFirmantes', (
      SELECT json_agg(json_build_object('nombre', signed_by, 'total', total))
      FROM (
        SELECT signed_by, COUNT(*) as total
        FROM documents
        WHERE type = tipo_doc AND org_id = org_id_param
          AND deleted_at IS NULL AND signed_by IS NOT NULL
        GROUP BY signed_by ORDER BY total DESC LIMIT 5
      ) f
    )
  ) INTO result
  FROM documents
  WHERE type = tipo_doc::document_type
    AND org_id = org_id_param
    AND deleted_at IS NULL;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8.4 Implementación del Middleware (proxy.ts)

```typescript
// proxy.ts — CRÍTICO: nombre del archivo y export en Next.js 16
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)",
  ],
};
```

```typescript
// lib/supabase/middleware.ts — Lógica AAL
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(/* config */);
  const { data: { user } } = await supabase.auth.getUser();
  
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || /* ... */;
  const is2FARoute = path.startsWith("/verificar-2fa") || /* ... */;
  
  // No autenticado → login
  if (!user && !isAuthRoute && !is2FARoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Verificar AAL2 para rutas protegidas
  if (user && !is2FARoute && !isAuthRoute) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.nextLevel === "aal2" && aalData?.currentLevel === "aal1") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factorId = factors?.totp?.[0]?.id;
      if (factorId) {
        return NextResponse.redirect(
          new URL(`/verificar-2fa?factorId=${factorId}`, request.url)
        );
      }
    }
  }
  
  return response;
}
```

### 8.5 Server Action — Crear documento con validaciones

```typescript
// app/actions/documents.ts
'use server';

const TAMANO_MAXIMO_PDF = 15 * 1024 * 1024; // 15 MB

async function subirPdf(archivo: File, documentId: string, userId: string) {
  // Validar MIME type
  if (archivo.type !== "application/pdf") {
    return { error: "Solo se permiten archivos PDF" };
  }
  
  // Validar tamaño
  if (archivo.size > TAMANO_MAXIMO_PDF) {
    return { error: "El PDF no puede superar 15 MB" };
  }
  
  // Validar magic bytes (seguridad: evita file upload attack)
  const buffer = await archivo.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 5));
  const magic = String.fromCharCode(...bytes);
  if (!magic.startsWith("%PDF")) {
    return { error: "El archivo no es un PDF válido" };
  }
  
  // Subir a Supabase Storage
  const admin = getAdminClient();
  const ruta = `${userId}/${documentId}.pdf`;
  const { error } = await admin.storage
    .from("documents-pdfs")
    .upload(ruta, archivo, { upsert: true });
  
  if (error) return { error: "Error al subir el PDF" };
  return { pdf_url: ruta, pdf_filename: archivo.name, pdf_size_bytes: archivo.size };
}

export async function crearDocumento(formData: FormData): Promise<ActionResult> {
  const { user, orgId, permission, role } = await getUserAndOrg();
  
  if (!orgId) return { success: false, error: "Sin organización" };
  if (!puedeModificar(permission, role)) return { success: false, error: "Sin permiso" };
  
  // Validar con Zod v4
  const resultado = documentoSchema.safeParse({
    type: formData.get("type"),
    description: formData.get("description"),
    document_date: formData.get("document_date"),
    // ...
  });
  
  if (!resultado.success) {
    return { success: false, error: resultado.error.issues[0].message };
    //                                              ^^^^^^
    //                          Zod v4: .issues no .errors
  }
  
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("documents")
    .insert({ ...resultado.data, created_by: user.id, org_id: orgId })
    .select("id")
    .single();
  
  if (error) return { success: false, error: "Error al guardar" };
  
  // PDF opcional
  const archivoPdf = formData.get("pdf") as File | null;
  if (archivoPdf && archivoPdf.size > 0) {
    const resPdf = await subirPdf(archivoPdf, data.id, user.id);
    if (resPdf.error) return { success: false, error: resPdf.error };
    await admin.from("documents").update({ pdf_url: resPdf.pdf_url }).eq("id", data.id);
  }
  
  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  return { success: true, id: data.id };
}
```

### 8.6 Componente de gráficos con tema dinámico

```typescript
// components/domain/dashboard-charts.tsx
'use client';
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
    ? { barColor: "#BD93F9", gridColor: "#44475A", tickColor: "#6272A4" }  // Dracula
    : { barColor: "#4a8a00", gridColor: "#cce8a0", tickColor: "#5a7a3a" }; // Aurora
}

export function DashboardCharts({ datosPorMes, datosPorAnio }) {
  const colors = useThemeColors();
  // ...
}
```

### 8.7 Monitoreo de almacenamiento

```sql
-- Función pg_cron ejecutada diariamente a las 8 AM UTC
CREATE OR REPLACE FUNCTION check_storage_usage()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  total_bytes bigint;
  limit_bytes bigint := 1073741824; -- 1 GB
  uso_porcentaje numeric;
BEGIN
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
  INTO total_bytes
  FROM storage.objects WHERE bucket_id = 'documents-pdfs';
  
  uso_porcentaje := (total_bytes::numeric / limit_bytes::numeric) * 100;
  
  IF uso_porcentaje >= 90 THEN
    -- Notificar a todos los admins de cada organización
    FOR admin_record IN 
      SELECT id, org_id FROM profiles WHERE role = 'admin'
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = admin_record.id AND type = 'storage_warning'
        AND created_at > NOW() - INTERVAL '24 hours'
      ) THEN
        INSERT INTO notifications (user_id, org_id, type, title, body, read)
        VALUES (
          admin_record.id, admin_record.org_id, 'storage_warning',
          'Almacenamiento al ' || ROUND(uso_porcentaje, 1) || '%',
          'El almacenamiento ha alcanzado ' || pg_size_pretty(total_bytes) || ' de 1 GB.',
          false
        );
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- Programar ejecución diaria
SELECT cron.schedule('check-storage-daily', '0 8 * * *', 'SELECT check_storage_usage();');
```

---

## 9. Seguridad Implementada

### 9.1 Resumen de vulnerabilidades y estado

| Vulnerabilidad | Mecanismo | Estado |
|---|---|---|
| **IDOR** | org_id filter + RLS | Protegido |
| **File Upload RCE** | MIME + tamaño + magic bytes | Protegido |
| **Auth bypass** | AAL2 obligatorio en middleware | Protegido |
| **Path Traversal** | Next.js App Router | Protegido por framework |
| **XSS** | React escaping automático | Protegido por framework |
| **SQL Injection** | Supabase prepared statements |  Protegido por ORM |
| **Fingerprinting** | Cloudflare proxy naranja |  Mitigado |
| **DDoS** | Cloudflare WAF | Protegido |
| **Brute force 2FA** | Bloqueo 30s tras 3 intentos | Protegido |

### 9.2 RLS Policies implementadas

```sql
-- Documentos: solo de la misma organización
CREATE POLICY select_documentos ON documents FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Allowed emails: filtro por org
CREATE POLICY allowed_emails_select_own_org ON allowed_emails FOR SELECT
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Allowed emails UPDATE: solo admins
CREATE POLICY allowed_emails_update_own_org ON allowed_emails FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND org_id = allowed_emails.org_id
  )
);

-- Audit log: solo ver los de tu organización
CREATE POLICY audit_log_select_own_org ON audit_log FOR SELECT
USING (
  user_id IN (SELECT id FROM profiles WHERE org_id = (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  ))
);
```

### 9.3 Evaluación final de seguridad (Burp Suite)

```
Puntuación: 8.5/10 — Apto para producción

✅ IDOR:           No vulnerable (org_id + RLS)
✅ Auth:           Fuerte (middleware + AAL2)
✅ Path traversal: No aplica (Next.js)
✅ XSS:            No aplica (React)
✅ File upload:    Protegido (magic bytes)
🟡 Route exposure: Aceptable (Next.js hardcoded)
✅ Fingerprinting: Mitigado (Cloudflare)
```

---

## 10. Subida a GitHub

### 10.1 Inicialización del repositorio

```bash
# En el directorio del proyecto
git init
git branch -M main

# Crear .gitignore
cat > .gitignore << 'EOF'
# Dependencias
node_modules/
.pnpm-store/

# Variables de entorno (NUNCA subir)
.env
.env.local
.env.*.local

# Next.js build
.next/
out/

# Misc
.DS_Store
*.log
EOF
```

### 10.2 Primer commit

```bash
# Agregar todos los archivos iniciales
git add .

# Verificar qué se va a commitear
git status

# Primer commit
git commit -m "feat: setup inicial Next.js 16 + Supabase + Tailwind v4"
```

### 10.3 Conectar con GitHub

```bash
# Crear repositorio en github.com/Knin90/gestion-documental
# (desde la web de GitHub)

# Conectar remote
git remote add origin https://github.com/Knin90/gestion-documental.git

# Push inicial
git push -u origin main
```

### 10.4 Flujo de commits durante el desarrollo

```bash
# Después de cada feature o fix:
git add archivo-modificado.tsx
git commit -m "feat: descripción clara del cambio"
git push origin main
# → Vercel detecta el push y hace deploy automático
```

### 10.5 Archivos importantes en el repositorio

| Archivo | Propósito |
|---|---|
| `schema.sql` | Schema completo de la DB para reproducir |
| `.env.example` | Template de variables sin valores reales |
| `funcionalidades.md` | Especificación de funcionalidades |
| `STYLE_GUIDE.md` | Guía de estilos y tokens de diseño |
| `vercel.json` | Configuración de cron jobs |
| `docs/diagramas/*.puml` | 15 diagramas UML del sistema |
| `.npmrc` | Configuración de pnpm |

### 10.6 Integración con Vercel (auto-deploy)

Vercel escucha el repositorio de GitHub. Cada `git push origin main` desencadena:

```
1. Vercel clona el repositorio (commit específico)
2. Instala dependencias: pnpm install
3. Compila: next build (Turbopack)
4. TypeScript check
5. Si pasa → deploy a producción
6. Si falla → notificación de error + keep previous deploy
```

---

## 11. Despliegue en Producción

### 11.1 Configuración de Vercel

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-storage",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 11.2 Variables de entorno en Vercel

Configuradas en **Project Settings → Environment Variables**:

| Variable | Ambiente | Tipo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Sensitive |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | Sensitive |
| `CRON_SECRET` | Production, Preview | Sensitive |

### 11.3 Flujo completo de tráfico en producción

```
Usuario → gestion.kunix.dev
         ↓
Cloudflare (proxy naranja)
  - WAF + DDoS protection
  - SSL termination
  - Oculta headers Vercel
         ↓
Vercel Edge Network (iad1 - Washington DC)
  - proxy.ts (Middleware)
  - Verifica autenticación
  - Redirige si necesario
         ↓
Serverless Function (Node.js 18)
  - Server Component o Server Action
  - Llama a Supabase
         ↓
Supabase (jxdolalnzyougapygskx)
  - PostgreSQL con RLS
  - Auth con JWT
  - Storage S3
         ↓
Respuesta al usuario
```

---

## 12. Testing y Verificación

### 12.1 Testing manual por hito

Para cada hito se verifican los siguientes escenarios:

#### Hito 1 — Autenticación

| Test | Resultado esperado |
|---|---|
| Login con email/password correcto | Redirige a /verificar-2fa |
| Login con credenciales incorrectas | Muestra error rojo |
| Login con Google | OAuth flow completo → /verificar-2fa |
| Login con Microsoft | OAuth flow completo → /verificar-2fa |
| Código 2FA correcto | Redirige a /dashboard |
| Código 2FA incorrecto × 3 | Bloqueo 30 segundos |
| Recuperar contraseña | Email enviado correctamente |
| Registro nueva organización | Cuenta + org creada, redirige a /login |
| Registro con código inválido | Error "Código inválido" |
| Registro con email ya usado | Error "Correo ya registrado" |

#### Hito 3 — Documentos

| Test | Resultado esperado |
|---|---|
| Crear documento sin PDF | Documento creado, estado "Pendiente" |
| Crear con PDF válido | PDF adjuntado, estado "PDF" |
| Subir archivo no-PDF | Error "Solo se permiten PDFs" |
| Subir PDF > 15MB | Error "Supera 15 MB" |
| Subir archivo PHP renombrado .pdf | Error "Archivo no es PDF válido" (magic bytes) |
| Editar documento | Cambios guardados correctamente |
| Eliminar documento | Desaparece de la lista |
| Viewer intenta crear | Error "Sin permiso" |

```

### 12.2 Verificar build de Vercel

Después de cada push importante:

1. Ir a **vercel.com → Deployments**
2. Verificar que el último commit esté en estado **Ready** (no **Error**)
3. Si hay error, revisar los logs de build:
   - Errores de TypeScript son los más comunes
   - Imports faltantes
   - Nombres duplicados de funciones

### 12.3 Errores frecuentes y soluciones

| Error | Causa | Solución |
|---|---|---|
| `Cannot find name 'useState'` | Import faltante | Agregar `import { useState } from "react"` |
| `the name X is defined multiple times` | Función duplicada en archivo | Verificar con `grep -n "function X"` y eliminar duplicado |
| `Type error: ... LucideIcon` | Tipo incorrecto en icon prop | Usar `import { type LucideIcon } from "lucide-react"` |
| Build usa commit viejo | Vercel caché | `git commit --allow-empty -m "chore: force redeploy" && git push` |
| `.issues` vs `.errors` en Zod | Zod v4 cambio de API | Usar siempre `.issues` |

### 12.4 Monitoreo post-deploy

Después del deploy verificar:

```bash
# 1. Verificar que la app responde
curl -I https://gestion.kunix.dev
# → HTTP/2 200

# 2. Verificar headers de seguridad (Cloudflare oculta Vercel)
curl -I https://gestion.kunix.dev | grep -i "server"
# → No debe mostrar "Server: Vercel"

# 3. Verificar redirect de dominio raíz
curl -I https://kunix.dev
# → HTTP/2 301 → https://gestion.kunix.dev
```

---

## 13. Estado Final del Proyecto

### 13.1 Funcionalidades completadas

| Hito | Funcionalidad | Estado |
|---|---|---|
| 0 | Planificación completa (15 diagramas, wireframes, docs) | ✅ |
| 1 | Auth: email, Google, Microsoft, 2FA TOTP obligatorio | ✅ |
| 1 | Registro organización + usuario con código | ✅ |
| 1 | Recuperación de contraseña | ✅ |
| 2 | Dashboard con estadísticas y gráficos | ✅ |
| 2 | Tema claro (Aurora Forest) + oscuro (Dracula) | ✅ |
| 2 | Sidebar con navegación dinámica por rol | ✅ |
| 3 | CRUD documentos recibidos y enviados | ✅ |
| 3 | Adjuntar PDFs con validaciones (MIME + magic bytes) | ✅ |
| 3 | Paginación 18 documentos | ✅ |
| 4 | Búsqueda avanzada con paginación (14 resultados) | ✅ |
| 4 | Importar desde Excel (SheetJS) | ✅ |
| 4 | Exportar a Excel (SheetJS) | ✅ |
| 5 | Gestión usuarios: invitar, roles, permisos | ✅ |
| 5 | Transferir propiedad de organización | ✅ |
| + | Monitoreo storage (pg_cron + notificaciones) | ✅ |
| + | Audit log automático con triggers | ✅ |
| + | RLS en todas las tablas | ✅ |
| + | Cloudflare proxy + redirect rules | ✅ |
| + | Logo y favicon personalizados | ✅ |

### 13.2 Métricas del proyecto

| Métrica | Valor |
|---|---|
| Líneas de código aprox. | ~5,000 líneas TypeScript/TSX |
| Archivos de código | ~60 archivos |
| Tablas en la DB | 6 tablas + auth.users |
| Diagramas UML | 15 diagramas PlantUML |
| Tiempo de build | ~30 segundos |
| Puntuación seguridad | 8.5/10 (Burp Suite) |
| Cobertura de funcionalidades | 100% de los hitos planificados |

### 13.3 Decisiones técnicas clave tomadas

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| `proxy.ts` en lugar de `middleware.ts` | `middleware.ts` | Cambio de Next.js 16 |
| Inline styles para glassmorphism | Clases Tailwind v4 | Incompatibilidad Tailwind v4 |
| Python scripts para reemplazos | heredocs bash | Caracteres especiales en bash |
| Soft delete con `deleted_at` | DELETE físico | Recuperabilidad futura |
| Magic bytes validation | Solo MIME type | Previene file upload attack |
| pg_cron para monitoreo | Vercel Cron solo | Redundancia + menor latencia |
| `next/dynamic ssr:false` para Three.js | Import directo | Evita errores SSR |

---

>  **Repositorio:** [github.com/Knin90/gestion-documental](https://github.com/Knin90/gestion-documental)  
>  **Producción:** [gestion.kunix.dev](https://gestion.kunix.dev)  
>  **Última actualización:** Junio 2026
