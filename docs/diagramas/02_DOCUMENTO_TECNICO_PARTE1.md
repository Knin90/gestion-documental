# 🛠️ Documento Técnico — Gestión Documental

> **Versión:** 2.0 | **Fecha:** Junio 2026  
> **Repositorio:** [github.com/Knin90/gestion-documental](https://github.com/Knin90/gestion-documental)  
> **Producción:** [gestion.kunix.dev](https://gestion.kunix.dev)

---

## Tabla de Contenidos

1. [Origen del Proyecto](#1-origen-del-proyecto)
2. [Recopilación de Requisitos](#2-recopilación-de-requisitos)
3. [Elección del Stack Tecnológico](#3-elección-del-stack-tecnológico)
4. [Registro en Servicios Externos](#4-registro-en-servicios-externos)
5. [Configuración del Entorno de Desarrollo](#5-configuración-del-entorno-de-desarrollo)
6. [Flujo de Trabajo](#6-flujo-de-trabajo)
7. [Arquitectura y Estructura del Proyecto](#7-arquitectura-y-estructura-del-proyecto)
8. [Desarrollo del Código](#8-desarrollo-del-código)
9. [Seguridad Implementada](#9-seguridad-implementada)
10. [Subida a GitHub](#10-subida-a-github)
11. [Despliegue en Producción](#11-despliegue-en-producción)
12. [Testing y Verificación](#12-testing-y-verificación)
13. [Estado Final del Proyecto](#13-estado-final-del-proyecto)

---

## 1. Origen del Proyecto

### El problema

Una organización de hasta 10 personas gestionaba el registro de documentos oficiales (notas, circulares, oficios, facturas) usando hojas de cálculo de Excel. Este enfoque presentaba varios problemas:

- **Sin acceso simultáneo:** Solo una persona podía editar a la vez
- **Sin control de versiones:** Cambios sin historial ni trazabilidad
- **Sin adjuntos organizados:** Los PDFs estaban dispersos en carpetas locales
- **Sin búsqueda eficiente:** Buscar un documento antiguo era lento y manual
- **Sin roles ni permisos:** Cualquier persona podía modificar o borrar datos

### La solución propuesta

Reemplazar Excel con una **aplicación web multi-tenant** accesible desde cualquier navegador, con autenticación segura, roles de usuario, búsqueda avanzada y almacenamiento de PDFs en la nube.

---

## 2. Recopilación de Requisitos

Antes de escribir una sola línea de código, se realizó un proceso estructurado de recopilación de requisitos.

### 2.1 Preguntas iniciales

Las siguientes preguntas definieron el alcance del proyecto:

**Sobre los usuarios:**
- ¿Cuántos usuarios usarán el sistema simultáneamente? → **~10 usuarios**
- ¿Necesitan niveles de acceso diferentes? → **Sí: admin, editor, viewer**
- ¿Trabajan desde la oficina o remotamente? → **Ambos — necesita ser web**

**Sobre los documentos:**
- ¿Qué tipos de documentos se registran? → **Recibidos y enviados (nunca mezclados)**
- ¿Se necesita adjuntar el PDF original? → **Sí, pero es opcional al crear**
- ¿Cuántos documentos aproximados por año? → **~200-500 documentos/año/org**
- ¿Se necesita historial de cambios? → **Sí — audit log**

**Sobre el negocio:**
- ¿Una sola organización o múltiples? → **Multi-tenant — cada org aislada**
- ¿Quién administra las cuentas de usuario? → **El admin de cada organización**
- ¿Se necesita exportar datos? → **Sí — compatible con Excel**

**Sobre seguridad:**
- ¿Qué tan sensibles son los documentos? → **Documentos oficiales — alta seguridad**
- ¿Se requiere 2FA? → **Sí — obligatorio para todos**
- ¿Qué proveedores de login? → **Email, Google, Microsoft**

### 2.2 Funcionalidades definidas

Del proceso de preguntas surgió la lista de funcionalidades agrupadas por hitos:

**Hito 0 — Planificación**
- Diagramas UML (ERD, casos de uso, flujos)
- Wireframes SVG de las 9 pantallas principales
- Documento de planificación LaTeX (28 páginas)
- `funcionalidades.md` con especificaciones
- `STYLE_GUIDE.md` con tema visual Aurora Forest

**Hito 1 — Autenticación**
- Login email/password
- Login Google OAuth
- Login Microsoft OAuth
- 2FA TOTP obligatorio
- Registro de organización
- Registro de usuario con código de acceso
- Recuperación de contraseña

**Hito 2 — Dashboard y Layout**
- Sidebar con navegación
- Panel de control con estadísticas
- Gráficos Recharts
- Selector tema claro/oscuro

**Hito 3 — Gestión de Documentos**
- CRUD completo (crear, ver, editar, eliminar)
- Adjuntar PDF con validaciones
- Paginación 18 documentos
- Filtro pendientes de PDF

**Hito 4 — Búsqueda y Exportación**
- Búsqueda avanzada (ID, mes, año, tipo)
- Paginación en búsqueda (14 resultados)
- Importar desde Excel (SheetJS)
- Exportar a Excel (SheetJS)

**Hito 5 — Gestión de Usuarios**
- Invitar usuarios con código de acceso
- Roles: admin / user
- Permisos: editor / viewer
- Transferir propiedad de organización
- Eliminar usuarios

**Extras implementados:**
- Monitoreo de almacenamiento (pg_cron + notificaciones)
- Audit log automático con triggers
- Seguridad RLS en todas las tablas
- Logo y favicon personalizados
- Tema Dracula (modo oscuro)

---

## 3. Elección del Stack Tecnológico

### 3.1 Criterios de selección

| Criterio | Descripción |
|---|---|
| **Velocidad de desarrollo** | Framework con convenciones sólidas |
| **Escalabilidad** | Puede crecer sin reescribir |
| **Seguridad** | Auth y DB con RLS incluidos |
| **Costo** | Plan gratuito viable para el proyecto |
| **Mantenibilidad** | TypeScript para evitar errores en runtime |

### 3.2 Stack seleccionado

```
Frontend:   Next.js 16.2.6 + React 19 + TypeScript
Estilos:    Tailwind CSS v4
UI:         Shadcn/ui + Lucide React + Sonner (toasts)
Gráficos:   Recharts
3D/Visual:  Three.js (lazy load)
Excel:      SheetJS (xlsx)
PDF view:   PDF.js (planificado)

Backend:    Supabase (BaaS)
  Auth:     Email + Google + Microsoft + TOTP MFA
  DB:       PostgreSQL 15 con RLS
  Storage:  Bucket S3-compatible (PDFs)
  Realtime: WebSockets para notificaciones

Hosting:    Vercel (auto-deploy desde GitHub)
CDN/Proxy:  Cloudflare
Dominio:    kunix.dev (Cloudflare)

Dev tools:  pnpm 10.x, Turbopack, VS Code
VCS:        Git + GitHub
```

### 3.3 Por qué Next.js 16 y no otras opciones

| Opción | Razón de descarte |
|---|---|
| Create React App | Deprecado, sin SSR, sin Server Actions |
| Vite + React | Sin Server Components, más configuración |
| Remix | Ecosistema más pequeño, menos documentación |
| SvelteKit | Curva de aprendizaje, menos librerías compatibles |
| **Next.js 16** ✅ | SSR, Server Actions, App Router, Vercel integration |

### 3.4 Por qué Supabase y no otras opciones

| Opción | Razón de descarte |
|---|---|
| Firebase | NoSQL — relaciones complejas con multi-tenant |
| PlanetScale | Sin Auth integrado, más configuración |
| Neon + Auth.js | Dos servicios separados, más complejidad |
| **Supabase** ✅ | PostgreSQL + Auth + Storage + RLS + Realtime en uno |

### 3.5 Consideraciones especiales de Next.js 16

Next.js 16 introduce cambios importantes respecto a versiones anteriores:

```typescript
// ⚠️ IMPORTANTE: proxy.ts en lugar de middleware.ts
// El nombre del archivo Y la función exportada cambian

// INCORRECTO (Next.js < 16):
// middleware.ts → export function middleware() {}

// CORRECTO (Next.js 16):
// proxy.ts → export function proxy() {}
export function proxy(request: NextRequest) {
  return updateSession(request);
}
```

---

## 4. Registro en Servicios Externos

### 4.1 Supabase

1. Ir a [supabase.com](https://supabase.com) → **Start your project**
2. Crear cuenta con GitHub o email
3. Crear nuevo proyecto:
   - **Name:** `gestion-documental`
   - **Database Password:** contraseña segura (guardar en lugar seguro)
   - **Region:** `East US (North Virginia)` — más cercano a Vercel iad1
4. Esperar ~2 minutos a que el proyecto se inicialice
5. Ir a **Settings → API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nunca exponer al cliente)

```
Proyecto ID: jxdolalnzyougapygskx
URL: https://jxdolalnzyougapygskx.supabase.co
```

#### Configurar Auth en Supabase

1. **Authentication → URL Configuration:**
   - Site URL: `https://gestion.kunix.dev`
   - Redirect URLs: `https://gestion.kunix.dev/auth/callback`

2. **Authentication → Providers → Google:**
   - Requiere crear un proyecto en [Google Cloud Console](https://console.cloud.google.com)
   - Crear credenciales OAuth 2.0 → Aplicación web
   - Authorized JavaScript origins: `https://gestion.kunix.dev`
   - Authorized redirect URIs: `https://jxdolalnzyougapygskx.supabase.co/auth/v1/callback`
   - Copiar Client ID y Client Secret a Supabase

3. **Authentication → Providers → Azure:**
   - Registrar app en [Azure Portal](https://portal.azure.com)
   - Client ID: `c4f6f4f1-9fce-4020-bd42-2d44e4128394`
   - Redirect URI: `https://jxdolalnzyougapygskx.supabase.co/auth/v1/callback`

4. **Authentication → MFA:**
   - Habilitar TOTP
   - Factor enrollment: `Required`

#### Crear el schema SQL

Ejecutar `schema.sql` en el SQL Editor de Supabase con todas las tablas, RLS policies, triggers y funciones.

### 4.2 Vercel

1. Ir a [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. **Add New Project** → Importar repositorio `gestion-documental`
3. Framework: **Next.js** (detectado automáticamente)
4. Agregar variables de entorno en **Settings → Environment Variables:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://jxdolalnzyougapygskx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=<hex generado con openssl rand -hex 32>
```

5. Deploy → La URL generada es `gestion-documental.vercel.app`
6. **Settings → Domains** → Agregar dominio personalizado `gestion.kunix.dev`

### 4.3 Cloudflare

1. Dominio `kunix.dev` ya registrado en Cloudflare
2. Agregar registro DNS:
   - Tipo: `CNAME`
   - Nombre: `gestion`
   - Destino: `cname.vercel-dns.com` (o el que asigna Vercel)
3. Activar **proxy naranja** para ocultar infraestructura
4. SSL/TLS: **Full** (no Flexible)
5. Agregar registros `AAAA 100::` para `@` y `www` con redirect rules

---

## 5. Configuración del Entorno de Desarrollo

### 5.1 Instalar pnpm

El proyecto usa `pnpm` como gestor de paquetes por su velocidad y eficiencia en el uso de disco.

```bash
# Instalar pnpm globalmente
npm install -g pnpm@10

# Verificar instalación
pnpm --version
# → 10.x.x
```

### 5.2 Crear el proyecto Next.js

```bash
# Crear proyecto con create-next-app
pnpm create next-app@latest gestion-documental \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd gestion-documental
```

### 5.3 Instalar dependencias

```bash
# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# UI
pnpm add lucide-react sonner

# Charts
pnpm add recharts

# Excel
pnpm add xlsx

# 3D (opcional)
pnpm add three @types/three

# Validación
pnpm add zod

# Formularios (opcional)
pnpm add @hookform/resolvers react-hook-form
```

### 5.4 Configurar .npmrc

```ini
# .npmrc
public-hoist-pattern[]=*
shamefully-hoist=true
```

### 5.5 Variables de entorno

Crear `.env.local` (no subir a Git):

```env
NEXT_PUBLIC_SUPABASE_URL=https://jxdolalnzyougapygskx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
CRON_SECRET=tu_secret_generado_con_openssl
```

Crear `.env.example` (sí subir a Git):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

### 5.6 Iniciar servidor de desarrollo

```bash
pnpm dev
# → http://localhost:3000
# Turbopack activo por defecto en Next.js 16
```
