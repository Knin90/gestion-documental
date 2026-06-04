"use client";

export function LoadingBackground() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "linear-gradient(135deg, #e8f4f1 0%, #dceef8 100%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(5,57,49,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 75% 70%, rgba(0,100,160,0.08) 0%, transparent 55%)",
          animation: "bgShift 10s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes bgShift {
          0%   { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1;   transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}
