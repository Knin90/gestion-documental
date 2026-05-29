"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)", padding: "1rem" }}>
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#053931", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#CBEFEB", fontSize: "1.5rem" }}>✉</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "var(--foreground)", marginBottom: "0.5rem" }}>
            Revisa tu correo
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>
          <a href="/login" style={{ display: "inline-block", padding: "10px 20px", backgroundColor: "#053931", color: "#CBEFEB", borderRadius: "8px", textDecoration: "none", fontSize: "0.875rem", fontWeight: "500" }}>
            Volver al login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#053931", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#CBEFEB", fontSize: "1.25rem" }}>🔑</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "var(--foreground)", margin: "0 0 0.25rem" }}>
            Recuperar contraseña
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", margin: 0 }}>
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <form onSubmit={handleSubmit} method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label htmlFor="email" style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--foreground)" }}>
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
              style={{ height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "var(--background)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none" }}
            />
          </div>

          {error && (
            <div role="alert" style={{ fontSize: "0.875rem", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "8px 12px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ height: "40px", borderRadius: "8px", border: "none", backgroundColor: loading ? "#374151" : "#053931", color: "#CBEFEB", fontSize: "0.875rem", fontWeight: "500", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>

        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          <a href="/login" style={{ color: "#48A89A", textDecoration: "underline" }}>
            Volver al login
          </a>
        </p>

      </div>
    </div>
  );
}
