"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ActualizarContrasenaPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    if (password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
        return;
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#053931", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#CBEFEB", fontSize: "1.25rem" }}>🔒</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "var(--foreground)", margin: "0 0 0.25rem" }}>
            Nueva contraseña
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", margin: 0 }}>
            Elige una contraseña segura de al menos 12 caracteres
          </p>
        </div>

        <form onSubmit={handleSubmit} method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--foreground)" }}>
              Nueva contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Mínimo 12 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", height: "40px", padding: "0 44px 0 12px", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "var(--background)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--muted-foreground)", display: "flex", alignItems: "center" }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: "2px 0 0" }}>
              {password.length}/12 caracteres mínimos
            </p>
          </div>

          {error && (
            <div role="alert" style={{ fontSize: "0.875rem", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "8px 12px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 12}
            style={{ height: "40px", borderRadius: "8px", border: "none", backgroundColor: (loading || password.length < 12) ? "#9ca3af" : "#053931", color: "#CBEFEB", fontSize: "0.875rem", fontWeight: "500", cursor: (loading || password.length < 12) ? "not-allowed" : "pointer" }}
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>

        </form>

      </div>
    </div>
  );
}
