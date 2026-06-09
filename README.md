# Gestión Documental

> Sistema web multi-tenant para gestión de documentos oficiales — reemplaza el uso de Excel en oficinas y organizaciones.

**Producción:** [gestion.kunix.dev](https://gestion.kunix.dev) &nbsp;|&nbsp; **Repo:** [github.com/Knin90/gestion-documental](https://github.com/Knin90/gestion-documental)

---

## Características

- **Documentos recibidos y enviados** — registro completo con adjuntos PDF opcionales
- **Autenticación segura** — email/password, Google OAuth, Microsoft OAuth + 2FA TOTP obligatorio
- **Multi-tenant** — organizaciones completamente aisladas por `org_id` + RLS
- **Roles y permisos** — admin / user + editor / viewer
- **Búsqueda avanzada** — por ID, mes, año, tipo con paginación
- **Dashboard** — estadísticas en tiempo real con gráficos Recharts
- **Importar / Exportar Excel** — compatible con SheetJS
- **Notificaciones en tiempo real** — Supabase Realtime + WebSocket
- **Monitoreo de almacenamiento** — alerta automática al 90% (pg_cron diario)
- **Tema claro / oscuro** — Aurora Forest + Dracula Theme
- **Seguridad 8.5/10** — IDOR protegido, magic bytes, Cloudflare WAF

---

## Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 16.2.6 + React 19 + TypeScript |
| **Estilos** | Tailwind CSS v4 |
| **Gráficos** | Recharts |
| **Excel** | SheetJS (xlsx) |
| **3D / Visual** | Three.js (lazy load) |
| **Backend** | Supabase (Auth + PostgreSQL + Storage + Realtime) |
| **Hosting** | Vercel (auto-deploy) |
| **CDN / Proxy** | Cloudflare |
| **Gestor paquetes** | pnpm 10.x |
| **Build** | Turbopack |

---

## Inicio Rápido

### Prerrequisitos

- Node.js 18+
- pnpm 10.x
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Knin90/gestion-documental.git
cd gestion-documental

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env.local
```

### Variables de entorno

Edita `.env.local` con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
CRON_SECRET=genera_con_openssl_rand_hex_32
```

### Base de datos

Ejecuta `schema.sql` en el SQL Editor de Supabase para crear todas las tablas, RLS policies, triggers y funciones.

### Desarrollo

```bash
pnpm dev
# → http://localhost:3000
```

---

## Estructura del Proyecto

```
gestion-documental/
├── app/
│   ├── (auth)/          # Login, registro, 2FA, recuperar contraseña
│   ├── (protected)/     # Dashboard, documentos, búsqueda, perfil
│   ├── actions/         # Server Actions (auth, documents, invite, notifications)
│   └── api/cron/        # Vercel Cron endpoint
├── components/
│   ├── auth/            # TwoFALayout, CodeInput, ErrorAlert
│   ├── domain/          # Charts, selector tipo, botones eliminar
│   └── layout/          # Sidebar, header, notificaciones, temas
├── lib/
│   ├── supabase/        # Client, server, middleware (AAL check)
│   └── schemas/         # Zod v4 schemas
├── public/              # Logo, videos login/registro
├── docs/diagramas/      # 15 diagramas PlantUML
├── proxy.ts             # Middleware Next.js 16
├── schema.sql           # Schema completo de la base de datos
├── vercel.json          # Configuración cron jobs
└── STYLE_GUIDE.md       # Guía de estilos Aurora Forest / Dracula
```

---

## Seguridad

| Vulnerabilidad | Estado |
|---|---|
| IDOR | Protegido (org_id + RLS) |
| File Upload RCE | Protegido (MIME + magic bytes %PDF) |
| Auth bypass | Protegido (AAL2 obligatorio) |
| XSS | Protegido (React escaping) |
| SQL Injection | Protegido (Supabase prepared statements) |
| Fingerprinting | Mitigado (Cloudflare proxy naranja) |
| DDoS | Protegido (Cloudflare WAF) |
| Brute force 2FA | Protegido (bloqueo 30s tras 3 intentos) |


---

## Roles y Permisos

```
Propietario (Owner)
  └── Administrador (Admin)
        └── Editor
              └── Viewer (Solo lectura)
```

| Acción | Viewer | Editor | Admin | Owner |
|---|---|---|---|---|
| Ver documentos | ✅ | ✅ | ✅ | ✅ |
| Crear / Editar | ❌ | ✅ | ✅ | ✅ |
| Eliminar todos | ❌ | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ | ✅ |
| Transferir propiedad | ❌ | ❌ | ❌ | ✅ |

---

## Base de Datos

6 tablas con RLS habilitado en todas:

| Tabla | Descripción |
|---|---|
| `organizations` | Organizaciones multi-tenant |
| `profiles` | Perfiles de usuario con roles |
| `documents` | Documentos con soft delete |
| `allowed_emails` | Whitelist de invitaciones |
| `notifications` | Notificaciones en tiempo real |
| `audit_log` | Trazabilidad de cambios |

---

## Convenciones Importantes

```typescript
// Next.js 16: proxy.ts (NO middleware.ts)
export function proxy(request: NextRequest) { ... }

// Zod v4: .issues (NO .errors)
resultado.error.issues[0].message

// Tailwind v4: glassmorphism con inline styles
style={{ backdropFilter: "blur(24px)" }}

// Three.js: siempre lazy load
const OceanBackground = dynamic(() => import('./ocean'), { ssr: false })
```

---

## Diagramas UML

El proyecto incluye 15 diagramas Diagrama UML en `docs/diagramas/`:

| # | Diagrama |
|---|---|
| 01 | ERD Detallado con RLS |
| 02 | Casos de Uso completo |
| 03 | Flujo Primer Acceso |
| 04 | Flujo Registrar (con errores) |
| 05 | Flujo Buscar (casos especiales) |
| 06 | Flujo Editar Documento |
| 07 | Flujo Eliminar (individual + masivo) |
| 08 | Arquitectura General |
| 09 | Diagrama de Despliegue |
| 10 | Componentes Frontend (7 capas) |
| 11 | Secuencia Login + Crear Doc |
| 12 | Diagrama de Componentes |
| 13 | Seguridad detallada (7 capas) |
| 14 | Base de Datos con seguridad |
| 15 | Flujo Importar / Exportar Excel |

Re

---

## Despliegue

El proyecto usa **Vercel** con auto-deploy en cada push a `main`:

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin main
# → Vercel detecta el push y despliega automáticamente
```

### Infraestructura

```
Usuario → Cloudflare (proxy + WAF) → Vercel (Next.js) → Supabase (DB + Auth + Storage)
```

---

## Licencia

Proyecto privado — todos los derechos reservados.

---

> Desarrollado con Next.js 16, Supabase y Vercel. Desplegado en [gestion.kunix.dev](https://gestion.kunix.dev)