"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

interface Shard {
  id: number;
  clipPath: string;
  tx: number;
  ty: number;
  rotate: number;
  delay: number;
  duration: number;
}

function generateShards(cols: number, rows: number): Shard[] {
  const shards: Shard[] = [];
  let id = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x1 = (c / cols) * 100;
      const y1 = (r / rows) * 100;
      const x2 = ((c + 1) / cols) * 100;
      const y2 = ((r + 1) / rows) * 100;

      const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 8;
      const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 8;

      // Triángulo 1
      shards.push({
        id: id++,
        clipPath: `polygon(${x1}% ${y1}%, ${x2}% ${y1}%, ${mx}% ${my}%)`,
        tx: (Math.random() - 0.5) * 300,
        ty: 200 + Math.random() * 400,
        rotate: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.4,
        duration: 1.5 + Math.random() * 0.8,
      });

      // Triángulo 2
      shards.push({
        id: id++,
        clipPath: `polygon(${x2}% ${y1}%, ${x2}% ${y2}%, ${mx}% ${my}%)`,
        tx: (Math.random() - 0.5) * 300,
        ty: 200 + Math.random() * 400,
        rotate: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.4,
        duration: 1.5 + Math.random() * 0.8,
      });

      // Triángulo 3
      shards.push({
        id: id++,
        clipPath: `polygon(${x2}% ${y2}%, ${x1}% ${y2}%, ${mx}% ${my}%)`,
        tx: (Math.random() - 0.5) * 300,
        ty: 200 + Math.random() * 400,
        rotate: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.4,
        duration: 1.5 + Math.random() * 0.8,
      });

      // Triángulo 4
      shards.push({
        id: id++,
        clipPath: `polygon(${x1}% ${y2}%, ${x1}% ${y1}%, ${mx}% ${my}%)`,
        tx: (Math.random() - 0.5) * 300,
        ty: 200 + Math.random() * 400,
        rotate: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.4,
        duration: 1.5 + Math.random() * 0.8,
      });
    }
  }

  return shards;
}

interface GlassBreakLinkProps {
  href: string;
  cardSelector: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassBreakLink({
  href,
  cardSelector,
  children,
  className,
  style,
}: GlassBreakLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const card = document.querySelector(cardSelector) as HTMLElement;
      if (!card) {
        router.push(href);
        return;
      }

      const rect = card.getBoundingClientRect();
      const shards = generateShards(4, 5);

      // Ocultar la tarjeta original
      card.style.opacity = "0";
      card.style.transition = "none";

      // Crear contenedor de fragmentos
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(container);

      // Efecto de flash blanco
      const flash = document.createElement("div");
      flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(203, 239, 235, 0.15);
        z-index: 9998;
        pointer-events: none;
        animation: glassFlash 0.6s ease-out forwards;
      `;
      document.body.appendChild(flash);

      // Crear cada fragmento
      shards.forEach((shard) => {
        const el = document.createElement("div");
        el.style.cssText = `
          position: absolute;
          inset: 0;
          clip-path: ${shard.clipPath};
          background-color: rgba(10, 10, 10, 0.55);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(203, 239, 235, 0.12);
          will-change: transform, opacity;
          animation: shardFall ${shard.duration}s cubic-bezier(0.55, 0, 1, 0.45) ${shard.delay}s forwards;
          --tx: ${shard.tx}px;
          --ty: ${shard.ty}px;
          --rot: ${shard.rotate}deg;
        `;
        container.appendChild(el);
      });

      // Inyectar keyframes si no existen
      if (!document.getElementById("glass-break-styles")) {
        const styleEl = document.createElement("style");
        styleEl.id = "glass-break-styles";
        styleEl.textContent = `
          @keyframes shardFall {
            0% {
              transform: translate(0, 0) rotate(0deg);
              opacity: 1;
            }
            20% {
              opacity: 1;
            }
            100% {
              transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
              opacity: 0;
            }
          }
          @keyframes glassFlash {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `;
        document.head.appendChild(styleEl);
      }

      // Navegar después de la animación
      setTimeout(() => {
        container.remove();
        flash.remove();
        router.push(href);
      }, 2500);
    },
    [href, cardSelector, router]
  );

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={{ ...style, cursor: "pointer" }}
    >
      {children}
    </a>
  );
}
