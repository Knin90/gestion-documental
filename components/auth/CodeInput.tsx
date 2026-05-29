"use client";

import React, { useRef, useEffect } from "react";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function CodeInput({ value, onChange, onComplete, disabled, autoFocus = true }: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(newValue);
    
    if (newValue.length === 6 && onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="2fa-code" className="text-sm font-medium text-foreground">
        Código de 6 dígitos
      </label>
      <input
        ref={inputRef}
        id="2fa-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-12 px-3 rounded-lg border border-input bg-background text-foreground text-xl text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <p className="text-xs text-muted-foreground text-center">
        El código cambia cada 30 segundos
      </p>
    </div>
  );
}
