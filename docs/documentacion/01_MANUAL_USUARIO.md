# Manual de Usuario — Gestión Documental

> **Versión:** 2.0 | **Fecha:** Junio 2026 | **URL:** [gestion.kunix.dev](https://gestion.kunix.dev)

---

## Tabla de Contenidos

1. [¿Qué es Gestión Documental?](#qué-es-gestión-documental)
2. [Primeros Pasos](#primeros-pasos)
3. [Iniciar Sesión](#iniciar-sesión)
4. [Verificación de Seguridad (2FA)](#verificación-de-seguridad-2fa)
5. [Panel de Control (Dashboard)](#panel-de-control-dashboard)
6. [Documentos Recibidos y Enviados](#documentos-recibidos-y-enviados)
7. [Crear un Nuevo Documento](#crear-un-nuevo-documento)
8. [Editar un Documento](#editar-un-documento)
9. [Eliminar Documentos](#eliminar-documentos)
10. [Buscar Documentos](#buscar-documentos)
11. [Importar desde Excel](#importar-desde-excel)
12. [Exportar a Excel](#exportar-a-excel)
13. [Mi Perfil](#mi-perfil)
14. [Gestión de Usuarios (Solo Admin)](#gestión-de-usuarios-solo-admin)
15. [Notificaciones](#notificaciones)
16. [Cambiar Tema (Claro / Oscuro)](#cambiar-tema-claro--oscuro)
17. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## ¿Qué es Gestión Documental?

**Gestión Documental** es un sistema web diseñado para reemplazar el uso de hojas de cálculo Excel en el registro y seguimiento de documentos oficiales. Permite a equipos de trabajo gestionar de forma centralizada todos los documentos recibidos y enviados por una organización.

### ¿Para qué sirve?

| Función | Descripción |
|---|---|
| Registrar documentos | Almacena notas, circulares, oficios y más |
| Adjuntar PDFs | Guarda el archivo original junto al registro |
| Buscar rápido | Encuentra cualquier documento en segundos |
| Ver estadísticas | Analiza la actividad documental de tu organización |
| Trabajo en equipo | Múltiples usuarios con roles y permisos |
| Importar / Exportar | Compatible con Excel para migración de datos |

---

## Primeros Pasos

### ¿Cómo acceder al sistema?

Ingresa desde cualquier navegador a:

```
https://gestion.kunix.dev
```

> Compatible con todos los navegadores.

### Tipos de cuenta

Existen dos formas de tener una cuenta:

**1. Crear una organización nueva** (si eres el administrador principal)
- Ve a **Crear cuenta → Registrar una organización**
- Completa el nombre de tu institución, tu nombre y correo
- Tú serás el **propietario** de la organización

**2. Unirse a una organización existente** (si eres un colaborador)
- Solicita un **código de acceso** al administrador de tu organización
- Ve a **Crear cuenta → Unirme con código de acceso**
- Ingresa el código, tu nombre, correo y contraseña

---

## Iniciar Sesión

### Métodos disponibles

Puedes iniciar sesión de tres formas:

#### Email y Contraseña
1. Ingresa tu correo electrónico
2. Ingresa tu contraseña
3. Haz clic en **Iniciar sesión**

#### Google
1. Haz clic en el botón **Google**
2. Selecciona tu cuenta de Google
3. Autoriza el acceso

#### Microsoft
1. Haz clic en el botón **Microsoft**
2. Ingresa tus credenciales de Microsoft/Office 365
3. Autoriza el acceso

### ¿Olvidaste tu contraseña?

1. Haz clic en **¿Olvidaste tu contraseña?**
2. Ingresa tu correo electrónico
3. Revisa tu bandeja de entrada
4. Sigue el enlace para crear una nueva contraseña

---

## Verificación de Seguridad (2FA)

El sistema requiere **verificación en dos pasos** para proteger tu cuenta.

### Primera vez: Configurar 2FA

1. Después de iniciar sesión, serás redirigido a la pantalla de configuración
2. Descarga una app de autenticación:
   - **Google Authenticator** (Android/iOS)
   - **Microsoft Authenticator** (Android/iOS)
3. Escanea el **código QR** que aparece en pantalla
4. Ingresa el código de 6 dígitos que muestra la app
5. ¡Listo! Tu cuenta queda protegida

### Ingresos siguientes

- Si tu sesión sigue activa → **entras directo sin pedir código**
- Si cerraste sesión → ingresa el código de 6 dígitos de tu app

> **Importante:** El código cambia cada 30 segundos. Si fallas 3 veces seguidas, habrá un bloqueo de 30 segundos antes de poder intentar nuevamente.

---

## Panel de Control (Dashboard)

El dashboard es la pantalla principal. Muestra estadísticas en tiempo real de tu organización.

### ¿Qué muestra?

| Tarjeta | Descripción |
|---|---|
| **Total de documentos** | Cantidad total registrada |
| **Este mes** | Documentos del mes en curso |
| **Este año** | Documentos del año actual |
| **Pendientes de PDF** | Documentos sin archivo adjunto |

### Gráficos

- **Documentos por mes** — Barras de enero a diciembre del año actual
- **Documentos por año** — Comparativa anual

### Top 5

- **Firmantes** más frecuentes
- **Destinatarios** más frecuentes

### Cambiar entre Recibidos / Enviados

Usa los botones **Recibidos** | **Enviados** en la esquina superior derecha para cambiar las estadísticas.

---

## Documentos Recibidos y Enviados

### Ver la lista de documentos

1. Haz clic en **Documentos** en el menú lateral
2. Selecciona **Recibidos** o **Enviados** con los botones superiores

### Filtrar pendientes de PDF

Haz clic en **Solo pendientes de PDF** para ver únicamente los documentos que no tienen archivo adjunto.

### Buscar por número de nota

Escribe en el campo de búsqueda superior para filtrar por el número o identificador del documento.

### Paginación

Los documentos se muestran de **18 en 18**. Usa los botones **Anterior** / **Siguiente** para navegar entre páginas.

---

## Crear un Nuevo Documento

1. Haz clic en **Nuevo documento** en el menú lateral o en el botón **Nuevo** de la lista
2. Completa el formulario:

| Campo | Obligatorio | Descripción |
|---|---|---|
| **Tipo** |  Sí | Recibido o Enviado |
| **N° Nota** | No | Número o código del documento |
| **Asunto** |  Sí | Descripción del contenido |
| **Procedencia** | No | De dónde proviene |
| **Atendido / Asignado** | No | Persona responsable |
| **Fecha** |  Sí | Fecha del documento |
| **Archivo PDF** | No | Adjuntar el documento escaneado |

3. Haz clic en **Guardar documento**

>  **Nota:** Puedes crear el documento sin PDF y adjuntarlo después desde la pantalla de edición.

### Restricciones del PDF

- Solo archivos **PDF** (no Word, imagen, etc.)
- Tamaño máximo: **15 MB**

---

## Editar un Documento

1. En la lista de documentos, haz clic en **Editar** en la fila del documento
2. Modifica los campos necesarios
3. Si deseas agregar o reemplazar el PDF, selecciona el archivo
4. Haz clic en **Guardar cambios**

>  Solo los usuarios con permiso **Editor** o rol **Admin** pueden editar documentos.

---

## Eliminar Documentos

### Eliminar uno por uno

1. En la lista, haz clic en "eliminar" de la fila del documento
2. El documento desaparece de la lista

### Eliminar todos los de un tipo (Solo Admin)

1. Haz clic en **Eliminar todos** (botón rojo en la parte superior)
2. Confirma la acción en el diálogo

---

## Buscar Documentos

1. Haz clic en **Buscar** en el menú lateral
2. Completa uno o más filtros:

| Filtro | Descripción |
|---|---|
| **Identificador** | Busca por número de nota (parcial) |
| **Tipo** | Todos / Recibidos / Enviados |
| **Año** | Filtra por año específico |
| **Mes** | Filtra por mes específico |
| **Orden** | Más reciente o más antiguo primero |

3. Haz clic en **Buscar**
4. Los resultados se muestran de **14 en 14** con paginación

### Limpiar búsqueda

Haz clic en **Limpiar** para resetear todos los filtros.

---

## Importar desde Excel

Permite cargar múltiples documentos de una sola vez desde un archivo Excel.

### Formato esperado del archivo

El archivo Excel debe tener estas columnas:

| Columna | Obligatorio |
|---|---|
| `description` o `Asunto` |  Sí |
| `document_date` o `Fecha` |  Sí |
| `type` o `Tipo` | Sí (recibido/enviado) |
| `document_id` o `N° Nota` | No |
| `signed_by` o `Procedencia` | No |
| `addressed_to` o `Destinatario` | No |

### Pasos para importar

1. Ve a **Importar** en el menú lateral
2. Selecciona tu archivo `.xlsx`, `.xls` o `.csv`
3. Revisa la previsualización de los datos
4. Si todo está correcto, confirma la importación
5. Los documentos aparecerán en la lista

> Solo usuarios con permiso **Editor** o **Admin** pueden importar.

---

## Exportar a Excel

Descarga todos los documentos en formato Excel para análisis externo.

1. Ve a **Exportar** en el menú lateral
2. Selecciona los filtros deseados (tipo, año, mes)
3. Haz clic en **Exportar**
4. Se descarga automáticamente un archivo `.xlsx`

> La exportación está disponible para **todos los usuarios**, incluyendo los de solo lectura.

---

## Mi Perfil

1. Haz clic en **Mi perfil** en el menú lateral

### Cambiar nombre

1. Modifica el campo **Nombre completo**
2. Haz clic en **Guardar nombre**

### Cambiar contraseña

1. Ingresa la **nueva contraseña** (mínimo 6 caracteres)
2. Repite la contraseña en **Confirmar contraseña**
3. Haz clic en **Cambiar contraseña**

> El correo electrónico **no se puede cambiar** desde el perfil. Contacta al administrador si necesitas cambiar el correo.

---

## Gestión de Usuarios (Solo Admin)

### Agregar un nuevo usuario

1. Ve a **Agregar usuario** en el menú lateral
2. Completa el formulario:
   - **Nombre completo**
   - **Correo electrónico**
   - **Rol:** Usuario o Administrador
   - **Permiso:** Editor (puede crear/editar/eliminar) o Solo lectura
3. Haz clic en **Agregar y generar código**
4. Copia el código generado y compártelo con el usuario

### Cambiar permisos de un usuario

En la tabla de usuarios, usa el selector de la columna **Permiso** para cambiar entre:
- **Editor** — puede crear, editar y eliminar documentos
- **Solo lectura** — solo puede ver documentos

### Cambiar rol de un usuario

En la columna **Rol**, cambia entre **Admin** y **Usuario**.

> No puedes cambiar el rol del **Propietario** de la organización.

### Transferir la propiedad

Si eres el **Propietario** y quieres ceder el cargo:
1. El nuevo propietario debe tener rol **Admin**
2. Haz clic en el ícono 👑 en la fila del usuario
3. Confirma la transferencia

>  Esta acción es irreversible a menos que el nuevo propietario te transfiera de vuelta.

### Eliminar un usuario

Haz clic en "eliminar" en la fila del usuario. Esto elimina su acceso al sistema.

---

## Notificaciones

El ícono 🔔 en el menú lateral muestra las notificaciones de tu organización.

### Tipos de notificaciones

| Tipo | Descripción |
|---|---|
|  Documento nuevo | Se registró un nuevo documento |
|  PDF subido | Se adjuntó un PDF a un documento |
|  Usuario nuevo | Un nuevo usuario se unió a la organización |
|  Almacenamiento al 90% | El espacio de PDFs está casi lleno |

### Marcar como leída

- Haz clic en una notificación para marcarla como leída
- Haz clic en **Marcar todas como leídas** para limpiar todas

---

## Cambiar Tema (Claro / Oscuro)

En la parte inferior del menú lateral encontrarás el selector de tema:

- **Claro** — Tema Aurora Forest (verde suave)
- **Oscuro** — Tema Dracula (púrpura y cyan)

El tema se guarda automáticamente para tu próxima visita.

---

