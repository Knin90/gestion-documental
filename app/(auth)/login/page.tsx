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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-primary-foreground text-2xl" aria-hidden="true">
              📄
            </span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">
            Gestión Documental
          </h1>
          <p className="text-sm text-muted-foreground">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="correo@ejemplo.com"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {/* Contraseña con botón de ojo */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <a href="/recuperar-contrasena" className="text-xs text-primary hover:underline">
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
                placeholder="••••••••"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Botón submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          {/* Registro */}
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <a href="/registro" className="text-primary hover:underline">
              Regístrate aquí
            </a>
          </p>

          {/* Nota 2FA */}
          <div className="text-center pt-4 border-t border-border">
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-primary">
                ¿Qué es la verificación en dos pasos?
              </summary>
              <p className="mt-2 text-left">
                Este sistema requiere autenticación de dos factores (2FA).
                Después de iniciar sesión, necesitarás un código de tu app
                autenticadora (Google Authenticator, Microsoft Authenticator, etc.).
              </p>
            </details>
          </div>

        </form>
      </div>
    </div>
  );
}