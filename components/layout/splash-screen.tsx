"use client";

import { useState, useEffect } from "react";
import { ScrambleText } from "@/components/layout/scramble-text";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"intro" | "exit" | "done">("intro");

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase("exit"), 3800);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 4800);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        transition: phase === "exit" ? "all 1s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "scale(1.05)" : "scale(1)",
        filter: phase === "exit" ? "blur(8px)" : "blur(0)",
      }}
    >
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "500px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(203,239,235,0.15), transparent)", animation: "splashLineH 1.5s ease-out forwards" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "1px", height: "200px", background: "linear-gradient(180deg, transparent, rgba(203,239,235,0.08), transparent)", animation: "splashLineV 1.8s ease-out forwards" }} />
      <div style={{ position: "absolute", left: 0, width: "100%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.3), rgba(255,0,50,0.3), transparent)", animation: "splashScan 2s linear forwards", top: "-5%" }} />

      <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
        <div style={{ width: "60px", height: "60px", margin: "0 auto 32px", borderRadius: "16px", border: "1px solid rgba(203,239,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(203,239,235,0.05)", animation: "splashIcon 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
          <span style={{ fontSize: "28px" }}>📋</span>
        </div>

        <ScrambleText text="Sistema de Gestión Documental" as="h1" speed={55} delay={600}
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.8rem)", fontWeight: 700, color: "white", letterSpacing: "-0.02em", marginBottom: "16px", fontFamily: "serif" }} />

        <ScrambleText text="Registro y control de documentos institucionales" as="p" speed={35} delay={2200}
          style={{ fontSize: "clamp(0.85rem, 1.5vw, 1.05rem)", color: "rgba(203,239,235,0.5)", letterSpacing: "0.05em", marginBottom: "40px" }} />

        <div style={{ width: "200px", height: "2px", margin: "0 auto", backgroundColor: "rgba(203,239,235,0.08)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, rgba(0,200,255,0.6), rgba(203,239,235,0.8), rgba(255,0,50,0.6))", animation: "splashBar 3.5s ease-in-out forwards", transformOrigin: "left" }} />
        </div>
      </div>

      <div style={{ position: "absolute", top: "40px", left: "40px", width: "30px", height: "30px", borderTop: "1px solid rgba(203,239,235,0.15)", borderLeft: "1px solid rgba(203,239,235,0.15)", animation: "splashCorner 0.6s ease-out 0.3s both" }} />
      <div style={{ position: "absolute", top: "40px", right: "40px", width: "30px", height: "30px", borderTop: "1px solid rgba(203,239,235,0.15)", borderRight: "1px solid rgba(203,239,235,0.15)", animation: "splashCorner 0.6s ease-out 0.5s both" }} />
      <div style={{ position: "absolute", bottom: "40px", left: "40px", width: "30px", height: "30px", borderBottom: "1px solid rgba(203,239,235,0.15)", borderLeft: "1px solid rgba(203,239,235,0.15)", animation: "splashCorner 0.6s ease-out 0.7s both" }} />
      <div style={{ position: "absolute", bottom: "40px", right: "40px", width: "30px", height: "30px", borderBottom: "1px solid rgba(203,239,235,0.15)", borderRight: "1px solid rgba(203,239,235,0.15)", animation: "splashCorner 0.6s ease-out 0.9s both" }} />

      <style>{`
        @keyframes splashLineH { 0% { width: 0; opacity: 0; } 100% { width: min(500px, 80vw); opacity: 1; } }
        @keyframes splashLineV { 0% { height: 0; opacity: 0; } 100% { height: 200px; opacity: 1; } }
        @keyframes splashScan { 0% { top: -5%; opacity: 1; } 100% { top: 105%; opacity: 0; } }
        @keyframes splashIcon { 0% { opacity: 0; transform: scale(0.5) rotateY(90deg); } 100% { opacity: 1; transform: scale(1) rotateY(0); } }
        @keyframes splashBar { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        @keyframes splashCorner { 0% { opacity: 0; transform: scale(0); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
