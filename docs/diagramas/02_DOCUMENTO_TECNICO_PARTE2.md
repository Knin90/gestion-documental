# 🛠️ Documento Técnico — Parte 2: Flujo de Trabajo y Estructura

---

## 6. Flujo de Trabajo

### 6.1 Metodología de desarrollo

El proyecto siguió una metodología iterativa basada en **hitos (milestones)** con ciclos cortos de planificación → desarrollo → prueba → deploy.

```
Planificación → Hito 0 → Hito 1 → Hito 2 → ... → Producción
     │              │         │         │
  Diagramas     Auth      Layout    CRUD
  Wireframes    2FA       Dashboard Búsqueda
  Docs          OAuth     Sidebar   Export
```

### 6.2 Ciclo de desarrollo por feature

Cada nueva funcionalidad sigue este flujo:

```
1. Analizar archivo existente
   └── cat / sed / grep para entender el estado actual

2. Planificar el cambio
   └── Identificar qué modificar, qué puede romperse

3. Implementar
   └── Editar archivos (scripts Python para cambios complejos)

4. Verificar localmente
   └── grep / head para confirmar que el cambio se aplicó

5. Commit atómico
   └── git add → git commit -m "feat/fix/style/security: descripción"

6. Push y deploy
   └── git push → Vercel auto-deploy

7. Verificar en producción
   └── Revisar build logs de Vercel
   └── Probar en gestion.kunix.dev
```

### 6.3 Convenciones de commits

```bash
feat:     Nueva funcionalidad
fix:      Corrección de bug
style:    Cambios visuales sin lógica
perf:     Mejoras de rendimiento
security: Mejoras de seguridad
docs:     Documentación
chore:    Mantenimiento (deps, config)
refactor: Refactorización sin cambio de comportamiento
```

### 6.4 Reglas de trabajo establecidas

Durante el desarrollo se establecieron reglas que se respetan en cada cambio:

**Reglas de código:**
- Nunca usar `middleware.ts` → siempre `proxy.ts` con export `proxy`
- Zod v4 usa `.issues` no `.errors`
- Tailwind v4: glassmorphism con **inline styles**, no clases utilitarias
- Three.js: siempre con `next/dynamic` + `ssr: false` + cleanup en `useEffect`
- Scripts Python para reemplazos complejos (evitar heredocs con caracteres especiales)

**Reglas de base de datos:**
- Toda tabla nueva necesita RLS habilitado desde el inicio
- Filtro `org_id` en todas las queries de Server Actions
- Soft delete con `deleted_at` — nunca `DELETE` físico
- Migraciones documentadas en `schema.sql`

**Reglas de seguridad:**
- `SUPABASE_SERVICE_ROLE_KEY` solo en Server Actions, nunca en cliente
- Verificar permisos en cada Server Action antes de operar
- Magic bytes validation para archivos PDF
- AAL2 verificado en middleware para todas las rutas protegidas

### 6.5 Estructura de ramas Git

```
main (producción)
  └── Único branch activo
  └── Cada commit = potencial deploy
  └── No hay develop/feature branches (proyecto personal)
```

### 6.6 Herramienta de modificaciones complejas

Para cambios en archivos que requieren reemplazar texto con caracteres especiales (comillas, saltos de línea, etc.), se usan scripts Python:

```python
# Patrón estándar de modificación
with open('archivo.tsx', 'r') as f:
    c = f.read()

c = c.replace(
    '''texto_original_exacto''',
    '''texto_nuevo'''
)

with open('archivo.tsx', 'w') as f:
    f.write(c)
print('OK')
```

---

## 7. Arquitectura y Estructura del Proyecto

### 7.1 Estructura de directorios

```
gestion-documental/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rutas auth (sin layout protegido)
│   │   ├── layout.tsx            # Animaciones CSS + fondo gradiente
│   │   ├── login/page.tsx        # Login con SplashScreen + Video
│   │   ├── registro/             # Registro organización / usuario
│   │   ├── verificar-2fa/        # Input código TOTP 6 dígitos
│   │   ├── configurar-2fa/       # QR code + enroll
│   │   ├── recuperar-contrasena/ # Email recovery
│   │   └── actualizar-contrasena/# Password reset
│   │
│   ├── (protected)/              # Grupo de rutas protegidas
│   │   ├── layout.tsx            # Server wrapper → client layout
│   │   ├── dashboard/page.tsx    # Panel de control (Server Component)
│   │   ├── documentos/
│   │   │   ├── page.tsx          # Lista paginada (Server Component)
│   │   │   ├── nuevo/page.tsx    # Formulario crear
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detalle documento
│   │   │       └── editar/page.tsx # Formulario editar
│   │   ├── buscar/page.tsx       # Búsqueda avanzada (Server Component)
│   │   ├── importar/page.tsx     # Import Excel (Client Component)
│   │   ├── exportar/page.tsx     # Export Excel (Client Component)
│   │   ├── perfil/page.tsx       # Info personal + contraseña
│   │   └── agregar-usuario/      # Gestión usuarios (admin only)
│   │
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts               # login, 2FA check
│   │   ├── documents.ts          # CRUD + PDF + permisos
│   │   ├── invite.ts             # invitar, roles, transferir
│   │   └── notifications.ts      # marcar leídas
│   │
│   ├── api/
│   │   └── cron/
│   │       └── check-storage/route.ts  # Vercel Cron endpoint
│   │
│   ├── auth/callback/route.ts    # OAuth callback handler
│   ├── favicon.ico               # Favicon (logo árbol circuitos)
│   ├── icon.png                  # App icon 512x512
│   ├── apple-icon.png            # Apple touch icon 180x180
│   ├── globals.css               # Variables CSS + tema Dracula/Aurora
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── auth/                     # Componentes específicos de auth
│   │   ├── TwoFALayout.tsx       # Layout shooting stars
│   │   ├── CodeInput.tsx         # 6 dígitos auto-submit
│   │   ├── ErrorAlert.tsx        # Alert de error
│   │   └── LoadingSpinner.tsx    # Overlay full screen
│   │
│   ├── domain/                   # Componentes de negocio
│   │   ├── dashboard-charts.tsx  # Recharts + useThemeColors()
│   │   ├── selector-tipo-dashboard.tsx # Recibido/Enviado toggle
│   │   ├── eliminar-todos-boton.tsx    # Confirmación masiva
│   │   └── eliminar-documento-boton.tsx # Eliminar individual
│   │
│   └── layout/                   # Componentes de layout
│       ├── sidebar.tsx           # Sidebar + Logo + Nav dinámica
│       ├── sidebar-item.tsx      # Item con active state exact match
│       ├── header.tsx            # Header móvil
│       ├── notification-bell.tsx # Campana + Realtime dropdown
│       ├── theme-toggle.tsx      # Switch claro/oscuro
│       ├── loading-background.tsx # CSS gradient animado
│       ├── splash-screen.tsx     # Canvas 3D cubos wireframe
│       └── scramble-text.tsx     # Decode text effect
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # AAL check + session refresh
│   └── schemas/
│       └── document.ts           # Zod v4 schema para documentos
│
├── public/
│   ├── logo.png                  # Logo para sidebar
│   ├── login.mp4                 # Video header login (H.264)
│   ├── login.webm                # Video header login (VP9 para Firefox)
│   ├── registrar.mp4             # Video header registro
│   └── registrar.webm            # Video header registro (VP9)
│
├── docs/
│   └── diagramas/                # 15 diagramas PlantUML
│
├── proxy.ts                      # Middleware Next.js 16 (no middleware.ts)
├── vercel.json                   # Cron job configuración
├── schema.sql                    # Schema completo de la base de datos
├── funcionalidades.md            # Especificación de funcionalidades
├── STYLE_GUIDE.md                # Guía de estilos Aurora Forest / Dracula
├── .env.example                  # Variables de entorno (template)
├── .npmrc                        # Configuración pnpm
├── next.config.ts                # Configuración Next.js
├── tailwind.config.ts            # Configuración Tailwind v4
├── tsconfig.json                 # Configuración TypeScript
└── package.json                  # Dependencias
```

### 7.2 Patrones arquitectónicos usados

**Server Components para lectura:**
```typescript
// app/(protected)/documentos/page.tsx
export default async function DocumentosPage({ searchParams }) {
  const supabase = await createClient(); // server client
  const { data } = await supabase.from('documents').select('...');
  return <TablaDocumentos documentos={data} />;
}
```

**Server Actions para mutaciones:**
```typescript
// app/actions/documents.ts
'use server';
export async function crearDocumento(formData: FormData) {
  const { user, orgId, permission, role } = await getUserAndOrg();
  if (!puedeModificar(permission, role)) return { error: '...' };
  // ... INSERT
}
```

**Client Components para interactividad:**
```typescript
'use client';
export function EliminarDocumentoBoton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    await eliminarDocumento(id);
    setLoading(false);
  }
  return <button onClick={handleClick}>...</button>;
}
```

### 7.3 Sistema de temas

El sistema de temas se implementa mediante variables CSS en `app/globals.css`:

```css
/* Tema claro — Aurora Forest */
:root {
  --background: #e8f4f1;
  --sidebar-primary: #4a8a00;
  --table-header: #c8e6a0;
  /* ... */
}

/* Tema oscuro — Dracula */
.dark {
  --background: #282A36;
  --sidebar-primary: #BD93F9;
  --table-header: #383A4A;
  /* ... */
}
```

### 7.4 Multi-tenancy

El aislamiento entre organizaciones se implementa en tres capas:

```
Capa 1 — Server Action:
  const { orgId } = await getUserAndOrg();
  .eq('org_id', orgId)  // ← filtro explícito

Capa 2 — RLS Policy (Supabase):
  CREATE POLICY select_documents ON documents
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

Capa 3 — Middleware:
  Verifica AAL2 antes de permitir acceso a rutas protegidas
```
