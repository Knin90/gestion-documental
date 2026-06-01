"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TwoFALayout } from "@/components/auth/TwoFALayout";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/actualizar-contrasena`,
      });

      if (error) {
        setError("No se pudo enviar el correo. Verifica la dirección e intenta de nuevo.");
        return;
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <TwoFALayout
        title="Revisa tu correo"
        description="Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
        icon="✉️"
      >
        <div style={{ textAlign: "center" }}>
          
            href="/login"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              backgroundColor: "rgba(203,239,235,0.1)",
              color: "rgba(203,239,235,0.9)",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: "500",
              border: "1px solid rgba(203,239,235,0.2)",
            }}
          >
            Volver al login
          </a>
        </div>
      </TwoFALayout>
    );
  }

  return (
    <TwoFALayout
      title="Recuperar contraseña"
      description="Te enviaremos un enlace para restablecer tu contraseña"
      icon="🔑"
    >
      <form onSubmit={handleSubmit} method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label
            htmlFor="email"
            style={{ fontSize: "0.875rem", fontWeight: "500", color: "rgba(203,239,235,0.7)" }}
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              height: "44px",
              padding: "0 14px",
              borderRadius: "10px",
              border: "1px solid rgba(203,239,235,0.2)",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "white",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              fontSize: "0.875rem",
              color: "#fca5a5",
              backgroundColor: "rgba(220,38,38,0.15)",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            height: "44px",
            borderRadius: "10px",
            border: "1px solid rgba(203,239,235,0.2)",
            backgroundColor: "rgba(203,239,235,0.1)",
            color: "rgba(203,239,235,0.9)",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Enviando..." : "Enviar enlace de recuperación"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem" }}>
        <a href="/login" style={{ color: "rgba(203,239,235,0.6)", textDecoration: "underline" }}>
          Volver al login
        </a>
      </p>
    </TwoFALayout>
  );
}
