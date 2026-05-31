"use client";

import { useRouter } from "next/navigation";
import { ScrambleText } from "@/components/layout/scramble-text";

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
        className="auth-card relative z-10 w-full max-w-xl rounded-3xl flex flex-col"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(203,239,235,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div className="text-center px-10 pt-10 pb-6">
          <div style={{ width: "120px", margin: "0 auto 16px", borderRadius: "16px", overflow: "hidden" }}>
            <video autoPlay loop muted playsInline preload="auto"
              ref={(el) => { if (el) { el.muted = true; el.load(); el.play().catch(() => {}); } }}
              style={{ width: "100%", height: "auto", display: "block" }}>
              <source src="/registrar.webm" type="video/webm" />
              <source src="/registrar.mp4" type="video/mp4" />
            </video>
          </div>
          <ScrambleText text="Crear cuenta" as="h1" className="text-3xl font-bold text-white mb-1" speed={70} delay={300} />
          <ScrambleText text="¿Cómo deseas registrarte?" as="p" className="text-sm" style={{ color: "rgba(203,239,235,0.65)" }} speed={45} delay={900} />
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
