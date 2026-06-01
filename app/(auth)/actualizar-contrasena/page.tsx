"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { TwoFALayout } from "@/components/auth/TwoFALayout";

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
    <TwoFALayout
      title="Nueva contraseña"
      description="Elige una contraseña segura de al menos 12 caracteres"
      icon="🔒"
    >
      <form onSubmit={handleSubmit} method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label
            htmlFor="password"
            style={{ fontSize: "0.875rem", fontWeight: "500", color: "rgba(203,239,235,0.7)" }}
          >
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
              style={{
                width: "100%",
                height: "44px",
                padding: "0 44px 0 14px",
                borderRadius: "10px",
                border: "1px solid rgba(203,239,235,0.2)",
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "rgba(203,239,235,0.5)",
                display: "flex",
                alignItems: "center",
              }}
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
          <p style={{ fontSize: "0.75rem", color: "rgba(203,239,235,0.5)", margin: "2px 0 0" }}>
            {password.length}/12 caracteres mínimos
          </p>
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
          disabled={loading || password.length < 12}
          style={{
            height: "44px",
            borderRadius: "10px",
            border: "1px solid rgba(203,239,235,0.2)",
            backgroundColor: "rgba(203,239,235,0.1)",
            color: "rgba(203,239,235,0.9)",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: (loading || password.length < 12) ? "not-allowed" : "pointer",
            opacity: (loading || password.length < 12) ? 0.5 : 1,
          }}
        >
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </TwoFALayout>
  );
}
