"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScrambleText } from "@/components/layout/scramble-text";

interface Cube {
  x: number;
  y: number;
  z: number;
  size: number;
  rx: number;
  ry: number;
  rz: number;
  srx: number;
  sry: number;
  srz: number;
  speed: number;
}

function createCube(): Cube {
  return {
    x: (Math.random() - 0.5) * 1600,
    y: (Math.random() - 0.5) * 900,
    z: Math.random() * 2000 + 500,
    size: Math.random() * 60 + 20,
    rx: Math.random() * Math.PI * 2,
    ry: Math.random() * Math.PI * 2,
    rz: Math.random() * Math.PI * 2,
    srx: (Math.random() - 0.5) * 0.02,
    sry: (Math.random() - 0.5) * 0.02,
    srz: (Math.random() - 0.5) * 0.01,
    speed: Math.random() * 2 + 1,
  };
}

function project(x: number, y: number, z: number, cx: number, cy: number): [number, number, number] {
  const fov = 600;
  const scale = fov / (fov + z);
  return [x * scale + cx, y * scale + cy, scale];
}

function rotatePoint(x: number, y: number, z: number, rx: number, ry: number, rz: number): [number, number, number] {
  let [px, py, pz] = [x, y, z];
  // Rotate X
  let cos = Math.cos(rx), sin = Math.sin(rx);
  let ny = py * cos - pz * sin, nz = py * sin + pz * cos;
  py = ny; pz = nz;
  // Rotate Y
  cos = Math.cos(ry); sin = Math.sin(ry);
  let nx = px * cos + pz * sin; nz = -px * sin + pz * cos;
  px = nx; pz = nz;
  // Rotate Z
  cos = Math.cos(rz); sin = Math.sin(rz);
  nx = px * cos - py * sin; ny = px * sin + py * cos;
  px = nx; py = ny;
  return [px, py, pz];
}

const CUBE_VERTICES: [number, number, number][] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];

const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cubesRef = useRef<Cube[]>([]);
  const animRef = useRef<number>(0);
  const [phase, setPhase] = useState<"intro" | "exit" | "done">("intro");

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase("exit"), 4200);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 5200);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Create cubes
    cubesRef.current = Array.from({ length: 35 }, () => createCube());

    function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
      const cx = w / 2;
      const cy = h / 2;
      const gridSize = 80;
      const gridDepth = 2000;
      const rows = 20;
      const cols = 24;

      ctx.strokeStyle = "rgba(203, 239, 235, 0.06)";
      ctx.lineWidth = 0.5;

      // Horizontal lines
      for (let i = -rows; i <= rows; i++) {
        const y = i * gridSize;
        const [x1, y1] = project(-cols * gridSize, y, gridDepth * 0.3, cx, cy);
        const [x2, y2] = project(cols * gridSize, y, gridDepth * 0.3, cx, cy);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Vertical lines
      for (let i = -cols; i <= cols; i++) {
        const x = i * gridSize;
        const [x1, y1] = project(x, -rows * gridSize, gridDepth * 0.3, cx, cy);
        const [x2, y2] = project(x, rows * gridSize, gridDepth * 0.3, cx, cy);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    function drawCube(ctx: CanvasRenderingContext2D, cube: Cube, cx: number, cy: number) {
      const projected: [number, number][] = [];
      let avgScale = 0;

      for (const [vx, vy, vz] of CUBE_VERTICES) {
        const [rx, ry, rz] = rotatePoint(vx * cube.size, vy * cube.size, vz * cube.size, cube.rx, cube.ry, cube.rz);
        const [px, py, scale] = project(cube.x + rx, cube.y + ry, cube.z + rz, cx, cy);
        projected.push([px, py]);
        avgScale += scale;
      }
      avgScale /= 8;

      if (avgScale < 0.01 || avgScale > 5) return;

      const alpha = Math.min(1, Math.max(0.1, avgScale * 1.2));
      ctx.strokeStyle = `rgba(203, 239, 235, ${alpha * 0.7})`;
      ctx.lineWidth = Math.max(0.5, avgScale * 1.5);

      for (const [a, b] of CUBE_EDGES) {
        ctx.beginPath();
        ctx.moveTo(projected[a][0], projected[a][1]);
        ctx.lineTo(projected[b][0], projected[b][1]);
        ctx.stroke();
      }
    }

    function animate() {
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx!.clearRect(0, 0, w, h);

      drawGrid(ctx!, w, h);

      for (const cube of cubesRef.current) {
        cube.z -= cube.speed * 3;
        cube.rx += cube.srx;
        cube.ry += cube.sry;
        cube.rz += cube.srz;

        // Reset cube when it passes camera
        if (cube.z < -200) {
          cube.z = 2000 + Math.random() * 500;
          cube.x = (Math.random() - 0.5) * 1600;
          cube.y = (Math.random() - 0.5) * 900;
          cube.size = Math.random() * 60 + 20;
        }

        drawCube(ctx!, cube, cx, cy);
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#0a0a0a",
        transition: phase === "exit" ? "all 1s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "scale(1.1)" : "scale(1)",
        filter: phase === "exit" ? "blur(12px)" : "blur(0)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
      }} />

      {/* Contenido central */}
      <div style={{
        position: "relative", zIndex: 2, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center",
      }}>
        <div style={{
          width: "70px", height: "70px", margin: "0 auto 36px", borderRadius: "18px",
          border: "1px solid rgba(203,239,235,0.25)", display: "flex", alignItems: "center",
          justifyContent: "center", backgroundColor: "rgba(203,239,235,0.05)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          animation: "splashIcon 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both",
        }}>
          <span style={{ fontSize: "32px" }}>📋</span>
        </div>

        <ScrambleText text="Sistema de Gesti\u00f3n Documental" as="h1" speed={55} delay={600}
          style={{
            fontSize: "clamp(1.6rem, 4vw, 3rem)", fontWeight: 700, color: "white",
            letterSpacing: "-0.02em", marginBottom: "16px", fontFamily: "serif",
          }} />

        <ScrambleText text="Registro y control de documentos institucionales" as="p" speed={35} delay={2200}
          style={{
            fontSize: "clamp(0.85rem, 1.5vw, 1.05rem)", color: "rgba(203,239,235,0.5)",
            letterSpacing: "0.05em", marginBottom: "48px",
          }} />

        <div style={{
          width: "220px", height: "2px", margin: "0 auto", backgroundColor: "rgba(203,239,235,0.08)",
          borderRadius: "2px", overflow: "hidden",
        }}>
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(90deg, rgba(0,200,255,0.6), rgba(203,239,235,0.8), rgba(255,0,50,0.6))",
            animation: "splashBar 3.8s ease-in-out forwards", transformOrigin: "left",
          }} />
        </div>
      </div>

      {/* Esquinas */}
      <div style={{ position: "absolute", top: 40, left: 40, width: 30, height: 30, borderTop: "1px solid rgba(203,239,235,0.2)", borderLeft: "1px solid rgba(203,239,235,0.2)", animation: "splashCorner 0.6s ease-out 0.3s both" }} />
      <div style={{ position: "absolute", top: 40, right: 40, width: 30, height: 30, borderTop: "1px solid rgba(203,239,235,0.2)", borderRight: "1px solid rgba(203,239,235,0.2)", animation: "splashCorner 0.6s ease-out 0.5s both" }} />
      <div style={{ position: "absolute", bottom: 40, left: 40, width: 30, height: 30, borderBottom: "1px solid rgba(203,239,235,0.2)", borderLeft: "1px solid rgba(203,239,235,0.2)", animation: "splashCorner 0.6s ease-out 0.7s both" }} />
      <div style={{ position: "absolute", bottom: 40, right: 40, width: 30, height: 30, borderBottom: "1px solid rgba(203,239,235,0.2)", borderRight: "1px solid rgba(203,239,235,0.2)", animation: "splashCorner 0.6s ease-out 0.9s both" }} />

      <style>{`
        @keyframes splashIcon { 0% { opacity: 0; transform: scale(0.5) rotateY(90deg); } 100% { opacity: 1; transform: scale(1) rotateY(0); } }
        @keyframes splashBar { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        @keyframes splashCorner { 0% { opacity: 0; transform: scale(0); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
