"use client";

export function LoadingBackground() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "radial-gradient(ellipse at 20% 50%, #0d2137 0%, #090a0f 60%, #0a1628 100%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 70% 20%, rgba(0,80,120,0.25) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(0,60,80,0.2) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(5,57,49,0.15) 0%, transparent 60%)
          `,
          animation: "bgPulse 8s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes bgPulse {
          0%   { opacity: 0.7; }
          50%  { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}
