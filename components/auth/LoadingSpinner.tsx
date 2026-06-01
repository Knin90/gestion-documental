"use client";

export function LoadingSpinner({ message = "Cargando..." }: { message?: string }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)",
      }}
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: "rgba(203,239,235,0.15)" }} />
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "rgba(0,255,255,0.6)", borderTopColor: "transparent" }} />
      </div>
      <p className="animate-pulse" style={{ color: "rgba(203,239,235,0.6)" }}>{message}</p>
    </div>
  );
}
