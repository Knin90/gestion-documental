"use client";

export function LoadingBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        background: "radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)",
      }}
    />
  );
}
