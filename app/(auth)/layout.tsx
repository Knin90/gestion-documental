import { LoadingBackground } from "@/components/layout/loading-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LoadingBackground />
      <style>{`
        @keyframes glitchIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
            filter: blur(12px);
          }
          20% {
            opacity: 0.7;
            transform: scale(1.02) translateX(-6px) skewX(-2deg);
            filter: blur(4px);
          }
          35% {
            transform: scale(0.98) translateX(5px) skewX(1deg);
            filter: blur(1px);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.01) translateX(-2px);
            filter: blur(0);
          }
          70% {
            transform: scale(0.995) translateX(1px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translate(0) skewX(0);
            filter: blur(0);
          }
        }

        @keyframes rgbSplit {
          0% {
            text-shadow:
              -4px 0 rgba(255, 0, 50, 0.8),
              4px 0 rgba(0, 200, 255, 0.8);
          }
          30% {
            text-shadow:
              3px 0 rgba(255, 0, 50, 0.5),
              -3px 0 rgba(0, 200, 255, 0.5);
          }
          60% {
            text-shadow:
              -1px 0 rgba(255, 0, 50, 0.2),
              1px 0 rgba(0, 200, 255, 0.2);
          }
          100% {
            text-shadow: none;
          }
        }

        @keyframes chromaGlow {
          0% {
            box-shadow:
              -6px 0 20px rgba(255, 0, 50, 0.5),
              6px 0 20px rgba(0, 200, 255, 0.5),
              0 0 40px rgba(255, 255, 255, 0.1);
          }
          40% {
            box-shadow:
              3px 0 12px rgba(255, 0, 50, 0.3),
              -3px 0 12px rgba(0, 200, 255, 0.3),
              0 0 20px rgba(255, 255, 255, 0.05);
          }
          100% {
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          }
        }

        @keyframes scanLine {
          0% { top: -5%; opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }

        @keyframes flashOverlay {
          0% { opacity: 0.2; }
          100% { opacity: 0; }
        }

        @keyframes inputSlide {
          0% {
            opacity: 0;
            transform: translateX(-15px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .auth-card {
          animation: glitchIn 2s cubic-bezier(0.16, 1, 0.3, 1) forwards,
                     chromaGlow 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .auth-card h1, .auth-card h2 {
          animation: rgbSplit 1.5s ease-out 0.3s both;
        }

        .auth-card form > div,
        .auth-card form > button {
          animation: inputSlide 1s ease-out both;
        }
        .auth-card form > div:nth-child(1) { animation-delay: 0.4s; }
        .auth-card form > div:nth-child(2) { animation-delay: 0.7s; }
        .auth-card form > div:nth-child(3) { animation-delay: 1.0s; }
        .auth-card form > button { animation-delay: 1.3s; }

        .auth-scan-line {
          position: fixed;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 0, 50, 0.3) 15%,
            rgba(203, 239, 235, 0.5) 50%,
            rgba(0, 200, 255, 0.3) 85%,
            transparent 100%
          );
          z-index: 100;
          pointer-events: none;
          animation: scanLine 1.8s linear forwards;
        }

        .auth-flash {
          position: fixed;
          inset: 0;
          z-index: 99;
          pointer-events: none;
          background: linear-gradient(
            135deg,
            rgba(255, 0, 50, 0.08) 0%,
            transparent 40%,
            transparent 60%,
            rgba(0, 200, 255, 0.08) 100%
          );
          animation: flashOverlay 1.2s ease-out forwards;
        }
      `}</style>
      {children}
    </>
  );
}
