"use client";
import { useState, useCallback } from "react";
import { login } from "@/app/actions/auth";
import { ScrambleText } from "@/components/layout/scramble-text";
import { SplashScreen } from "@/components/layout/splash-screen";


function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashDone = useCallback(() => setShowSplash(false), []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);




  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashDone} />}
    <div
      className="min-h-screen flex items-center justify-center px-8 py-8"
      style={{ position: "relative" }}
    >
      

      <div
        id="login-card"
        className="relative z-10 w-full max-w-2xl rounded-3xl flex flex-col min-h-[700px]"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(203, 239, 235, 0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* BLOQUE SUPERIOR */}
        <div className="px-14 pt-8 pb-6">
          <div style={{ width: "70%", margin: "0 auto", borderRadius: "16px", overflow: "hidden" }}>
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              ref={(el) => {
                if (el) {
                  el.muted = true;
                  el.load();
                  el.play().catch(() => {});
                }
              }}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <source src="/login.webm" type="video/webm" />
              <source src="/login.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="mx-14" style={{ height: "1px", backgroundColor: "rgba(203,239,235,0.12)" }} />

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="px-14 flex flex-col gap-5 flex-1 justify-center py-12">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: "rgba(203,239,235,0.8)" }}>Correo electrónico</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="correo@ejemplo.com" disabled={loading}
              style={{ height: "52px", padding: "0 18px", borderRadius: "12px", border: "1px solid rgba(203,239,235,0.2)", backgroundColor: "rgba(255,255,255,0.08)", color: "white", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", width: "100%" }} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: "rgba(203,239,235,0.8)" }}>Contraseña</label>
              <a href="/recuperar-contrasena" className="text-xs hover:underline" style={{ color: "rgba(203,239,235,0.6)" }}>¿Olvidaste tu contraseña?</a>
            </div>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="••••••••••••" disabled={loading}
                style={{ height: "52px", padding: "0 52px 0 18px", borderRadius: "12px", border: "1px solid rgba(203,239,235,0.2)", backgroundColor: "rgba(255,255,255,0.08)", color: "white", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", width: "100%" }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none p-2" style={{ color: "rgba(203,239,235,0.6)" }}>
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="text-sm rounded-xl p-4"
              style={{ backgroundColor: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ height: "52px", borderRadius: "12px", border: "none", backgroundColor: "white", color: "#053931", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", marginTop: "4px" }}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        {/* SOCIAL + REGISTRO */}
        <div className="px-14 pt-8 pb-12 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>O inicie sesión con</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-4">
            <button type="button" className="flex items-center justify-center gap-2 font-medium transition-all hover:opacity-80"
              style={{ height: "52px", minHeight: "52px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "0.9rem", cursor: "pointer" }}
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `https://gestion.kunix.dev/auth/callback` } });
              }}>
              <GoogleIcon /> Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 font-medium transition-all hover:opacity-80"
              style={{ height: "52px", minHeight: "52px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "0.9rem", cursor: "pointer" }}
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({ provider: "azure", options: { scopes: "email", redirectTo: `https://gestion.kunix.dev/auth/callback` } });
              }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022" /><rect x="13" y="1" width="10" height="10" fill="#7FBA00" /><rect x="1" y="13" width="10" height="10" fill="#00A4EF" /><rect x="13" y="13" width="10" height="10" fill="#FFB900" /></svg>
              Microsoft
            </button>
          </div>

          <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            ¿No tienes cuenta?{" "}
            <a href="/registro" className="font-semibold hover:underline" style={{ color: "rgba(203,239,235,1)" }}>Crear cuenta</a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}