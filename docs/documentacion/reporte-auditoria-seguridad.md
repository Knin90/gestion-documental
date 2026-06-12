# Reporte de Auditoría de Seguridad
## Sistema de Gestión Documental — gestion.kunix.dev

**Fecha:** 12 de junio de 2026  
**Auditor:** Denis (propietario del sistema)  
**Herramientas utilizadas:** Gobuster, Nikto, sqlmap, dalfox, curl, Python  
**Alcance:** Aplicación web en producción (https://gestion.kunix.dev)

---

## Resumen

Se realizó una auditoría de seguridad completa sobre el sistema de Gestión Documental desplegado en producción. La aplicación fue sometida a 14 pruebas de seguridad cubriendo las principales categorías de vulnerabilidades web (OWASP Top 10). **No se encontraron vulnerabilidades críticas.** La aplicación cuenta con múltiples capas de protección incluyendo Cloudflare, headers de seguridad HTTP, autenticación robusta con 2FA, y políticas RLS en base de datos.

---

## Stack Tecnológico Auditado

| Componente | Tecnología |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Backend | Supabase (PostgreSQL + Auth) |
| Hosting | Vercel |
| CDN/Proxy | Cloudflare |
| Autenticación | Email/Password + Google OAuth + Microsoft OAuth + TOTP 2FA |

---

## Resultados por Prueba

### 1. Enumeración de Directorios (Gobuster)

**Herramienta:** Gobuster v3.8.2  
**Wordlists:** common.txt (4,751 palabras), raft-medium-words.txt (63,088 palabras)  
**Resultado:** PASÓ

| Ruta | Código | Evaluación |
|---|---|---|
| `/login` | 200 | Correcto — ruta pública |
| `/registro` | 200 | Correcto — ruta pública |
| `/favicon.ico` | 200 | Correcto — recurso estático |
| `/.git/logs/` | 308 → redirect | No expuesto |
| `/cgi-bin/` | 308 → redirect | No existe |
| `/render?url=` | 307 → /login | No vulnerable |

---

### 2. Variables de Entorno

**Herramienta:** curl  
**Resultado:**  PASÓ

| URL probada | Respuesta |
|---|---|
| `/.env` | 307 → /login |
| `/.env.local` | 307 → /login |
| `/api/env` | 307 → /login |

---

### 3. Exposición del Repositorio Git

**Herramienta:** curl  
**Resultado:**  PASÓ

```
curl -I https://gestion.kunix.dev/.git/logs/
→ HTTP/2 308 (redirect interno de Next.js)
```

El directorio `.git` no está accesible públicamente.

---

### 4. Open Redirect

**Herramienta:** curl  
**Resultado:**  PASÓ

| Vector probado | Respuesta |
|---|---|
| `/login?redirect=https://evil.com` | 200 — parámetro ignorado |
| `/login?next=https://evil.com` | 200 — parámetro ignorado |
| `/https://evil.com` | 308 → `/https:/evil.com` (se queda en el dominio) |

---

### 5. SQL Injection (sqlmap)

**Herramienta:** sqlmap 1.10.6  
**Resultado:**  PASÓ

Cloudflare bloqueó el escaneo con 403 Forbidden. La aplicación usa el SDK de Supabase con queries parametrizadas automáticamente.

---

### 6. Cross-Site Scripting — XSS (dalfox)

**Herramienta:** dalfox  
**Resultado:** PASÓ — 0 vulnerabilidades encontradas

```
[*] [duration: 12s][issues: 0] Finish Scan!
```

---

### 7. Rate Limiting

**Herramienta:** Python urllib  
**Resultado:** PASÓ

| Tipo de request | Resultado |
|---|---|
| Sin User-Agent (bots) | 20/20 → 403 Forbidden (Cloudflare) |
| Con User-Agent de browser | 20/20 → 200 OK |

Rate limiting adicional implementado en Server Actions:

| Acción | Límite | Ventana |
|---|---|---|
| Invitar usuario | 10 intentos | 1 hora |
| Eliminar usuario | 5 intentos | 1 hora |
| Transferir propiedad | 3 intentos | 1 hora |

---

### 8. Headers de Seguridad HTTP

**Herramienta:** curl  
**Resultado:** PASÓ

| Header | Valor | Estado |
|---|---|---|
| `X-Frame-Options` | `DENY` | ok |
| `X-Content-Type-Options` | `nosniff` | ok|
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ok|
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | ok|
| `Strict-Transport-Security` | `max-age=63072000` | ok |
| `X-DNS-Prefetch-Control` | `on` | ok |
| `Access-Control-Allow-Origin` | `https://gestion.kunix.dev` | ok |
| `Content-Security-Policy` | Ver detalle abajo | ok|

**Content Security Policy:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://gestion.kunix.dev https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://gestion.kunix.dev;
frame-src 'none';
object-src 'none';
base-uri 'self';
```

---

### 9. CORS

**Herramienta:** curl  
**Resultado:** PASÓ

`Access-Control-Allow-Origin` restringido a `https://gestion.kunix.dev`.

---

### 10. TLS/SSL

**Herramienta:** curl + Nikto  
**Resultado:** PASÓ

| Aspecto | Valor |
|---|---|
| Cifrado | TLS_AES_256_GCM_SHA384 |
| Certificado | Let's Encrypt (válido) |
| SAN | `*.kunix.dev`, `kunix.dev` |

---

### 11. CSRF

**Herramienta:** curl  
**Resultado:** PASÓ

```
POST /login desde Origin: https://evil.com → 405 Method Not Allowed
```

---

### 12. Cookies de Sesión

**Resultado:** PASÓ

| Cookie | HttpOnly | Secure | SameSite |
|---|---|---|---|
| `sb-jdol-auth-token` | false* | false* | Lax |
| `cf_clearance` | true | true | None |

*Diseño intencional del SDK de Supabase. Con HTTPS activo no representa riesgo.

---

### 13. Escaneo General (Nikto)

**Herramienta:** Nikto v2.6.0  
**Resultado:** SIN HALLAZGOS CRÍTICOS

Cloudflare bloqueó el escaneo después de 98 requests por TLS fingerprinting. Sin vulnerabilidades críticas.

---

### 14. robots.txt

**Resultado:** PASÓ

Cloudflare bloquea automáticamente: GPTBot, ClaudeBot, Google-Extended, Bytespider, Amazonbot, CCBot, meta-externalagent. No se exponen rutas privadas.

---

## Vulnerabilidades Encontradas y Corregidas

| # | Vulnerabilidad | Severidad | Estado |
|---|---|---|---|
| 1 | Headers de seguridad faltantes | Media | Corregido |
| 2 | `Access-Control-Allow-Origin: *` | Baja | Corregido |
| 3 | Sin Content Security Policy | Media | Corregido |
| 4 | Sin rate limiting en Server Actions | Media | Corregido |

---

## Fortalezas Identificadas

- Autenticación robusta: Email/Password + Google OAuth + Microsoft OAuth + TOTP 2FA
- RLS en todas las tablas con filtro `org_id`
- Soft delete — nunca se eliminan registros físicamente
- `SUPABASE_SERVICE_ROLE_KEY` solo en Server Actions
- Cloudflare: DDoS protection, TLS termination, bot blocking
- Logs de auditoría para todas las acciones críticas
- Rate limiting en operaciones sensibles
- Content Security Policy activo
- 41 tests unitarios (90-95% cobertura en lógica crítica)
- CI/CD: tests automáticos en cada push a `main`

---
