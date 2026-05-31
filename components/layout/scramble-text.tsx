"use client";

import { useState, useEffect, useRef } from "react";

interface ScrambleTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  speed?: number;
  delay?: number;
  scrambleChars?: string;
}

export function ScrambleText({
  text,
  className,
  style,
  as: Tag = "span",
  speed = 50,
  delay = 0,
  scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*",
}: ScrambleTextProps) {
  const [display, setDisplay] = useState("");
  const [started, setStarted] = useState(false);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) {
      setDisplay("\u00A0".repeat(text.length));
      return;
    }

    let revealed = 0;
    const totalChars = text.length;
    const revealInterval = speed;
    const scrambleCycles = 4;

    startTimeRef.current = performance.now();

    function animate(now: number) {
      const elapsed = now - startTimeRef.current;
      revealed = Math.min(
        totalChars,
        Math.floor(elapsed / revealInterval)
      );

      let result = "";

      for (let i = 0; i < totalChars; i++) {
        if (i < revealed) {
          result += text[i];
        } else if (i < revealed + scrambleCycles) {
          if (text[i] === " ") {
            result += " ";
          } else {
            result += scrambleChars[
              Math.floor(Math.random() * scrambleChars.length)
            ];
          }
        } else {
          result += "\u00A0";
        }
      }

      setDisplay(result);

      if (revealed < totalChars) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(text);
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [started, text, speed, scrambleChars]);

  return (
    <Tag className={className} style={{ ...style, fontVariantNumeric: "tabular-nums" }}>
      {display}
    </Tag>
  );
}
