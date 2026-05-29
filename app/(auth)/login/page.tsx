"use client";
import { useState } from "react";
import { login } from "@/app/actions/auth";

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

export default function LoginPage() {
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
    <div
      className="min-h-screen flex items-center justify-end px-40 py-8"
      style={{
        backgroundImage: "url('/login-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center left",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />

      <div
        className="relative z-10 w-full max-w-xl rounded-3xl flex flex-col min-h-[700px]"
        style={{
          backgroundColor: "rgba(5, 57, 49, 0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(203, 239, 235, 0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* BLOQUE SUPERIOR — Saludo */}
        <div className="text-center px-14 pt-16 pb-10">
          <h1 className="font-serif text-4xl font-bold text-white mb-2">
            ¡Hola!
          </h1>
          <h2 className="font-serif text-2xl font-semibold text-white mb-3">
            Bienvenido de nuevo
          </h2>
          <p className="text-sm" style={{ color: "rgba(203,239,235,0.65)" }}>
            Inicia sesión para continuar
          </p>
        </div>

        {/* LÍNEA SEPARADORA */}
        <div className="mx-14" style={{ height: "1px", backgroundColor: "rgba(203,239,235,0.12)" }} />

        {/* BLOQUE MEDIO — Formulario */}
        <div className="px-14 flex flex-col gap-5 flex-1 justify-center py-12">

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: "rgba(203,239,235,0.8)" }}>
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="correo@ejemplo.com"
              disabled={loading}
              style={{
                height: "52px",
                padding: "0 18px",
                borderRadius: "12px",
                border: "1px solid rgba(203,239,235,0.2)",
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
                width: "100%",
              }}
            />
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: "rgba(203,239,235,0.8)" }}>
                Contraseña
              </label>
              <a href="/recuperar-contrasena" className="text-xs hover:underline" style={{ color: "rgba(203,239,235,0.6)" }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                disabled={loading}
                style={{
                  height: "52px",
                  padding: "0 52px 0 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(203,239,235,0.2)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                  width: "100%",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
                style={{ color: "rgba(203,239,235,0.6)" }}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="text-sm rounded-xl p-4" style={{ backgroundColor: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* Botón principal */}
          <button
            type="submit"
            form="login-form"
            disabled={loading}
            className="w-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              height: "52px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "white",
              color: "#053931",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "4px",
            }}
            onClick={(e) => {
              const form = document.querySelector("form");
              if (form) form.requestSubmit();
            }}
          >
            {loading ? "O inicie sesión con" : "Iniciar sesión"}
          </button>

        </div>

        {/* LÍNEA SEPARADORA */}
        <div className="mx-14" style={{ height: "1px", backgroundColor: "rgba(203,239,235,0.12)" }} />

        {/* BLOQUE INFERIOR — Social + Registro */}
        <div className="px-14 pt-8 pb-12 flex flex-col gap-5">

          {/* Separador texto */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              O inicie sesión con
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Google y Apple */}
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 font-medium transition-all hover:opacity-80"
              style={{
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
              onClick={() => alert("Google login próximamente")}
            >
              <GoogleIcon />
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 font-medium transition-all hover:opacity-80"
              style={{
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
              onClick={() => alert("Apple login próximamente")}
            >
              <AppleIcon />
              Apple
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 font-medium transition-all hover:opacity-80"
              style={{
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "0.9rem",
                cursor: "pointer",
                }}
              onClick={() => alert("Microsoft login próximamente")}
            >
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
    <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
  </svg>
  Microsoft
</button>
          </div>

          {/* Crear cuenta */}
          <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            ¿No tienes cuenta?{" "}
            <a href="/registro" className="font-semibold hover:underline" style={{ color: "rgba(203,239,235,1)" }}>
              Crear cuenta
            </a>
          </p>

        </div>

        {/* Formulario real (oculto para el submit) */}
        <form id="login-form" onSubmit={handleSubmit} className="hidden" />

      </div>
    </div>
  );
}