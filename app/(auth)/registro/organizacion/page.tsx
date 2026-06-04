"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";


function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <span style={{ display: "inline-flex", transition: "opacity 0.2s ease, transform 0.2s ease" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {visible ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </span>
  );
}

export default function RegistroOrganizacionPage() {
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
    const orgName = (formData.get("org_name") as string).trim();
    const fullName = (formData.get("full_name") as string).trim();
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          org_name: orgName,
          is_org_admin: true,
        },
      },
    });

    if (signUpError) {
      if (
        signUpError.message.includes("already registered") ||
        signUpError.message.includes("User already registered")
      ) {
        setError("Este correo ya tiene una cuenta. Inicia sesión directamente.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("No se pudo crear la cuenta. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    const slug =
      orgName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 80) +
      "-" +
      authData.user.id.substring(0, 6);

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, slug, created_by: authData.user.id })
      .select("id")
      .single();

    if (orgError || !org) {
      setError("Se creó tu cuenta pero hubo un problema al crear la organización. Contacta al soporte.");
      setLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ org_id: org.id, role: "admin", full_name: fullName })
      .eq("id", authData.user.id);

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 3000);
  }

  const inputStyle = {
    height: "48px",
    padding: "0 16px",
    borderRadius: "12px",
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(203,239,235,0.2)",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-8"
        style={{ position: "relative" }}
      >
        
        <div
          className="relative z-10 w-full max-w-xl rounded-3xl p-10 text-center"
          style={{
            backgroundColor: "rgba(10, 10, 10, 0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(203,239,235,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div className="w-14 h-14 rounded-full bg-green-500 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">¡Organización creada!</h1>
          <p className="text-sm mb-2" style={{ color: "rgba(203,239,235,0.75)" }}>
            Tu cuenta y organización han sido creadas correctamente.
          </p>
          <p className="text-sm" style={{ color: "rgba(203,239,235,0.5)" }}>
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-8 py-8"
      style={{ position: "relative" }}
    >
      
      <div
        className="auth-card relative z-10 w-full max-w-xl rounded-3xl flex flex-col"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(203,239,235,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div className="relative text-center px-10 pt-10 pb-6">
          <div className="absolute left-0 top-0 pt-10 pl-10">
            <a href="/registro" className="flex items-center gap-1 text-sm hover:underline" style={{ color: "rgba(203,239,235,0.6)" }}>&larr; Volver</a>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-1">Nueva organización</h1>
          <p className="text-sm" style={{ color: "rgba(203,239,235,0.65)" }}>
            Serás el administrador de tu organización
          </p>
        </div>

        <div className="mx-10" style={{ height: "1px", backgroundColor: "rgba(203,239,235,0.12)" }} />

        <form onSubmit={handleSubmit} className="px-10 py-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "rgba(203,239,235,0.8)" }}>
              Nombre de la organización <span className="text-red-400">*</span>
            </label>
            <input
              name="org_name"
              type="text"
              required
              maxLength={200}
              placeholder="Ej: Organización S.A."
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "rgba(203,239,235,0.8)" }}>
              Tu nombre completo <span className="text-red-400">*</span>
            </label>
            <input
              name="full_name"
              type="text"
              required
              placeholder="María González"
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "rgba(203,239,235,0.8)" }}>
              Correo electrónico <span className="text-red-400">*</span>
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="correo@ejemplo.com"
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "rgba(203,239,235,0.8)" }}>
              Contraseña <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                name="password"
                type={verPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                style={inputStyle}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{ color: "rgba(203,239,235,0.6)" }}
              >
                <EyeIcon visible={verPassword} />
              </button>
            </div>
          </div>

          {error && (
            <div
              className="text-sm rounded-xl p-3"
              style={{
                backgroundColor: "rgba(220,38,38,0.15)",
                border: "1px solid rgba(220,38,38,0.3)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold transition-opacity disabled:opacity-50"
            style={{
              height: "52px",
              borderRadius: "14px",
              backgroundColor: "#053931",
              color: "#CBEFEB",
              fontSize: "15px",
              border: "1px solid rgba(203,239,235,0.2)",
            }}
          >
            {loading ? "Creando organización..." : "Crear organización"}
          </button>

          <p className="text-center text-sm" style={{ color: "rgba(203,239,235,0.55)" }}>
            ¿Ya tienes cuenta?{" "}
            <a href="/login?nosplash=1" style={{ color: "#CBEFEB" }} className="hover:underline font-medium">
              Inicia sesión
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
