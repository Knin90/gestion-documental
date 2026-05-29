import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// CONFIGURACIÓN DE RUTAS
// ============================================================

const publicRoutes = ["/", "/login", "/registro", "/recuperar-contrasena", "/auth/callback"];
const authRoutes = ["/verificar-2fa", "/configurar-2fa", "/actualizar-contrasena"];
const apiRoutes = ["/api/auth", "/api/webhooks"];

const staticFileExtensions = [
  ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".ico", ".css", ".js", ".json", ".woff", ".woff2", ".ttf",
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname.startsWith(route));
}

function isStaticFile(pathname: string): boolean {
  return staticFileExtensions.some(ext => pathname.endsWith(ext));
}

function debugLog(message: string, data?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] ${message}`, data ? data : "");
  }
}

/**
 * Obtener el nivel AAL desde el token JWT
 * Los claims de Supabase incluyen: { aal: "aal1" | "aal2" | null }
 */
function getAALFromUser(user: any): "aal1" | "aal2" | null {
  // Intentar obtener del objeto user directamente
  if (user && typeof user === "object") {
    // Algunas versiones lo tienen en user.aal
    if ("aal" in user && (user.aal === "aal1" || user.aal === "aal2")) {
      return user.aal;
    }
    
    // Obtener del app_metadata
    if (user.app_metadata && typeof user.app_metadata === "object") {
      const aalClaim = user.app_metadata.aal;
      if (aalClaim === "aal1" || aalClaim === "aal2") {
        return aalClaim;
      }
    }
  }
  
  // Por defecto, si el usuario existe pero no sabemos su AAL, asumimos aal1
  return user ? "aal1" : null;
}

// ============================================================
// MIDDLEWARE PRINCIPAL
// ============================================================

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  
  if (isStaticFile(currentPath)) {
    return NextResponse.next();
  }
  
  if (matchesRoute(currentPath, apiRoutes)) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Obtener AAL desde el usuario (usando nuestra función helper)
  let aal = getAALFromUser(user);
  
  debugLog(`Path: ${currentPath}, User: ${user?.email || "none"}, AAL: ${aal}`);

  // Verificar si el usuario tiene 2FA configurado
  let hasMfaConfigured = false;
  if (user) {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      hasMfaConfigured = (factors?.totp?.length ?? 0) > 0;
      debugLog(`MFA configured: ${hasMfaConfigured}, factors: ${factors?.totp?.length || 0}`);
    } catch (err) {
      debugLog(`Error checking MFA factors: ${err}`);
      hasMfaConfigured = false;
    }
  }

  // ============================================================
  // CASO 1: USUARIO NO AUTENTICADO
  // ============================================================
  
  if (!user || userError) {
    debugLog(`Usuario no autenticado`);
    
    if (matchesRoute(currentPath, publicRoutes) || matchesRoute(currentPath, authRoutes)) {
      return supabaseResponse;
    }
    
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ============================================================
  // CASO 2: USUARIO AUTENTICADO EN RUTA PÚBLICA
  // ============================================================
  
  if (matchesRoute(currentPath, publicRoutes)) {
    debugLog(`Usuario autenticado en ruta pública`);
    
    if (aal === "aal2") {
      debugLog(`AAL2 → redirigiendo a dashboard`);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    if (hasMfaConfigured && aal === "aal1") {
      debugLog(`MFA configurado pero no verificado → redirigiendo a verificar-2fa`);
      return NextResponse.redirect(new URL("/verificar-2fa", request.url));
    }
    
    if (!hasMfaConfigured && aal === "aal1") {
      debugLog(`Sin MFA configurado → redirigiendo a configurar-2fa`);
      return NextResponse.redirect(new URL("/configurar-2fa", request.url));
    }
  }

  // ============================================================
  // CASO 3: RUTAS DE AUTENTICACIÓN (AAL1 permitido)
  // ============================================================
  
  if (matchesRoute(currentPath, authRoutes)) {
    debugLog(`Ruta de autenticación, permitiendo acceso`);
    return supabaseResponse;
  }

  // ============================================================
  // CASO 4: RUTAS PROTEGIDAS (requieren AAL2)
  // ============================================================
  
  if (hasMfaConfigured && aal !== "aal2") {
    debugLog(`Ruta protegida sin AAL2 → redirigiendo a verificar-2fa`);
    return NextResponse.redirect(new URL("/verificar-2fa", request.url));
  }
  
  if (!hasMfaConfigured && aal === "aal1") {
    debugLog(`Ruta protegida sin 2FA → redirigiendo a configurar-2fa`);
    return NextResponse.redirect(new URL("/configurar-2fa", request.url));
  }

  debugLog(`✅ Acceso permitido`);
  return supabaseResponse;
}

// ============================================================
// CONFIGURACIÓN DEL MATCHER
// ============================================================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|woff|woff2|ttf)$).*)",
  ],
};
