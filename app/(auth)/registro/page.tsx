"use client";

import { useRouter } from "next/navigation";

export default function RegistroSeleccionPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-8 py-8"
      style={{
        backgroundImage: "url('/login-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} />

      <div
        className="relative z-10 w-full max-w-xl rounded-3xl flex flex-col"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(203,239,235,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div className="text-center px-10 pt-10 pb-6">
          <div className="w-12 h-12 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Crear cuenta</h1>
          <p className="text-sm" style={{ color: "rgba(203,239,235,0.65)" }}>
            ¿Cómo deseas registrarte?
          </p>
        </div>

        <div
          className="mx-10"
          style={{ height: "1px", backgroundColor: "rgba(203,239,235,0.12)" }}
        />

        <div className="px-10 py-8 flex flex-col gap-4">
          <button
            onClick={() => router.push("/registro/organizacion")}
            className="w-full text-left"
            style={{
              padding: "20px 24px",
              borderRadius: "16px",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(203,239,235,0.18)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.11)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(203,239,235,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(203,239,235,0.18)";
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(203,239,235,0.12)" }}
              >
                <span className="text-xl">🏢</span>
              </div>
              <div>
                <p className="font-semibold text-white text-base mb-1">
                  Registrar una organización
                </p>
                <p className="text-sm" style={{ color: "rgba(203,239,235,0.55)" }}>
                  Crea una cuenta para tu institución. Serás el administrador y podrás invitar a tu equipo.
                </p>
              </div>
              <span className="flex-shrink-0 self-center ml-auto" style={{ color: "rgba(203,239,235,0.4)", fontSize: "20px" }}>→</span>
            </div>
          </button>

          <button
            onClick={() => router.push("/registro/usuario")}
            className="w-full text-left"
            style={{
              padding: "20px 24px",
              borderRadius: "16px",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(203,239,235,0.18)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.11)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(203,239,235,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(203,239,235,0.18)";
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(203,239,235,0.12)" }}
              >
                <span className="text-xl">👤</span>
              </div>
              <div>
                <p className="font-semibold text-white text-base mb-1">
                  Unirme con código de acceso
                </p>
                <p className="text-sm" style={{ color: "rgba(203,239,235,0.55)" }}>
                  Ya tengo un código que me dio el administrador de mi organización.
                </p>
              </div>
              <span className="flex-shrink-0 self-center ml-auto" style={{ color: "rgba(203,239,235,0.4)", fontSize: "20px" }}>→</span>
            </div>
          </button>

          <p className="text-center text-sm mt-2" style={{ color: "rgba(203,239,235,0.55)" }}>
            ¿Ya tienes cuenta?{" "}
            <a href="/login" style={{ color: "#CBEFEB" }} className="hover:underline font-medium">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
