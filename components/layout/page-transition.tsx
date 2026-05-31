"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "glitch" | "visible">("glitch");
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      setPhase("glitch");
      prevPath.current = pathname;
    }

    const t1 = setTimeout(() => setPhase("visible"), 600);
    return () => clearTimeout(t1);
  }, [pathname]);

  return (
    <>
      <style>{`
        @keyframes glitchIn {
          0% {
            opacity: 0;
            transform: scale(0.97) translateY(8px);
            filter: blur(8px);
          }
          15% {
            opacity: 0.6;
            transform: scale(1.01) translateX(-4px);
            filter: blur(2px);
          }
          30% {
            transform: scale(0.99) translateX(3px);
            filter: blur(0px);
          }
          45% {
            opacity: 0.85;
            transform: scale(1.005) translateX(-1px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translate(0);
            filter: blur(0);
          }
        }

        @keyframes rgbSplitIn {
          0% {
            text-shadow:
              -3px 0 rgba(255, 0, 50, 0.7),
              3px 0 rgba(0, 200, 255, 0.7);
            filter: brightness(1.3);
          }
          25% {
            text-shadow:
              2px 0 rgba(255, 0, 50, 0.5),
              -2px 0 rgba(0, 200, 255, 0.5);
          }
          50% {
            text-shadow:
              -1px 0 rgba(255, 0, 50, 0.3),
              1px 0 rgba(0, 200, 255, 0.3);
            filter: brightness(1.1);
          }
          100% {
            text-shadow: none;
            filter: brightness(1);
          }
        }

        @keyframes scanLine {
          0% { top: -10%; }
          100% { top: 110%; }
        }

        @keyframes chromaBorder {
          0% {
            box-shadow:
              -4px 0 12px rgba(255, 0, 50, 0.4),
              4px 0 12px rgba(0, 200, 255, 0.4),
              0 0 30px rgba(203, 239, 235, 0.15);
          }
          30% {
            box-shadow:
              2px 0 8px rgba(255, 0, 50, 0.25),
              -2px 0 8px rgba(0, 200, 255, 0.25),
              0 0 20px rgba(203, 239, 235, 0.1);
          }
          100% {
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          }
        }

        @keyframes overlayFlash {
          0% { opacity: 0.12; }
          15% { opacity: 0; }
          30% { opacity: 0.06; }
          50% { opacity: 0; }
          100% { opacity: 0; }
        }

        .page-transition-glitch {
          animation: glitchIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .page-transition-glitch > div:first-child {
          animation: chromaBorder 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .page-transition-glitch h1 {
          animation: rgbSplitIn 0.5s ease-out forwards;
        }

        .page-transition-visible {
          opacity: 1;
          transform: none;
        }

        .scan-line {
          position: fixed;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(0, 200, 255, 0.15) 20%,
            rgba(203, 239, 235, 0.25) 50%,
            rgba(255, 0, 50, 0.15) 80%,
            transparent 100%
          );
          z-index: 100;
          pointer-events: none;
          animation: scanLine 0.5s linear forwards;
        }

        .chroma-overlay {
          position: fixed;
          inset: 0;
          z-index: 99;
          pointer-events: none;
          background: linear-gradient(
            135deg,
            rgba(255, 0, 50, 0.05) 0%,
            transparent 40%,
            transparent 60%,
            rgba(0, 200, 255, 0.05) 100%
          );
          animation: overlayFlash 0.6s ease-out forwards;
        }
      `}</style>

      {phase === "glitch" && (
        <>
          <div className="scan-line" />
          <div className="chroma-overlay" />
        </>
      )}

      <div
        className={
          phase === "glitch"
            ? "page-transition-glitch"
            : "page-transition-visible"
        }
      >
        {children}
      </div>
    </>
  );
}
