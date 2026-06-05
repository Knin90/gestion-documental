"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  function toggleTheme() {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  if (!mounted) return <div className="h-8 w-16" />;

  return (
    <div
      className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {isDark
        ? <Moon className="h-4 w-4 text-sidebar-foreground" />
        : <Sun className="h-4 w-4 text-sidebar-foreground" />
      }
      <span className="text-xs text-sidebar-foreground flex-1">
        {isDark ? "Oscuro" : "Claro"}
      </span>

      {/* Toggle switch animado */}
      <div style={{ position: "relative", width: "36px", height: "20px", flexShrink: 0 }}>
        {/* Track */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "9999px",
          backgroundColor: isDark ? "var(--sidebar-primary)" : "#929292",
          opacity: isDark ? 1 : 0.35,
          transition: "background 250ms, opacity 250ms",
        }} />
        {/* Knob */}
        <div style={{
          position: "absolute",
          width: "16px",
          height: "16px",
          left: "2px",
          top: "2px",
          backgroundColor: "white",
          borderRadius: "9999px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          transform: isDark ? "translateX(16px)" : "translateX(0)",
          transition: "transform 250ms cubic-bezier(0.22, 1, 0.36, 1)",
        }} />
      </div>
    </div>
  );
}
