"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full_name") as string;

    const supabase = createClient();
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      if (error.message.includes("no está autorizado")) {
        setError("Este correo no tiene acceso. Pide a un usuario que te invite.");
      } else {
        setError("No se pudo crear la cuenta. Verifica los datos.");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    
    // Redirigir después de 3 segundos
    setTimeout(() => {
      router.push("/login");
    }, 3000);
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
            Regístrate para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium text-foreground">
              Nombre completo
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
              Correo electrónico
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
              Solo correos autorizados pueden registrarse.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres
            </p>
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
            {loading ? "Registrando..." : "Registrarse"}
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
