import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/registro") ||
    path.startsWith("/recuperar-contrasena") ||
    path.startsWith("/actualizar-contrasena");

  const is2FARoute =
    path.startsWith("/verificar-2fa") ||
    path.startsWith("/configurar-2fa");

  const isPublicRoute = isAuthRoute || path.startsWith("/auth/callback");

  // No autenticado → redirigir a login
  if (!user && !isPublicRoute && !is2FARoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Autenticado entrando a páginas de auth → verificar AAL
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Usuario autenticado — verificar nivel MFA
  if (user && !is2FARoute && !isPublicRoute) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const currentLevel = aalData?.currentLevel;
    const nextLevel = aalData?.nextLevel;

    // Necesita verificar 2FA pero no lo ha hecho en esta sesión
    if (nextLevel === "aal2" && currentLevel === "aal1") {
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
