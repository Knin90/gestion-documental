"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;
    const fullName = (formData.get("full_name") as string).trim();
    const accessCode = (formData.get("access_code") as string).trim().toUpperCase();

    if (!accessCode) {
      setError("El código de acceso es obligatorio");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Verificar código de acceso
    const { data: perfil } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("access_code", accessCode)
      .maybeSingle();

    if (!perfil) {
      setError("Código de acceso inválido. Contacta al administrador.");
      setLoading(false);
      return;
    }

    // Verificar que el correo coincide con el registrado
    if (perfil.email !== email) {
      setError("El correo no coincide con el código de acceso.");
      setLoading(false);
      return;
    }

    // Registrar usuario
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Este correo ya está registrado. Inicia sesión.");
      } else {
        setError("No se pudo crear la cuenta. Verifica los datos.");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-green-500 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
            ¡Registro exitoso!
          </h1>
          <p className="text-muted-foreground mb-4">
            Se ha enviado un correo de confirmación a tu bandeja de entrada.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-primary-foreground text-2xl">📝</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">
            Crear cuenta
          </h1>
          <p className="text-sm text-muted-foreground">
            Necesitas un código de acceso para registrarte
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Código de acceso — primero */}
          <div className="space-y-2">
            <label htmlFor="access_code" className="text-sm font-medium text-foreground">
              Código de acceso <span className="text-red-500">*</span>
            </label>
            <input
              id="access_code"
              name="access_code"
              type="text"
              required
              placeholder="Ej: M5SD8A9P"
              maxLength={8}
              style={{ textTransform: "uppercase" }}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Solicita este código al administrador del sistema
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium text-foreground">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="María González"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="correo@ejemplo.com"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Debe coincidir con el correo asociado a tu código de acceso
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={verPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Verificando..." : "Registrarse"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-primary hover:underline">
              Inicia sesión
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
