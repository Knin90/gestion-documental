"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { TwoFALayout } from "@/components/auth/TwoFALayout";
import { CodeInput } from "@/components/auth/CodeInput";
import { ErrorAlert } from "@/components/auth/ErrorAlert";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";

const MAX_ATTEMPTS = 3;
const SESSION_KEY = "2fa_attempts";

export default function Verificar2FAPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Recuperar intentos desde sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setAttempts(parseInt(saved, 10));
    }
  }, []);

  // Validar factorId
  useEffect(() => {
    const fid = searchParams.get("factorId");
    if (!fid) {
      router.push("/login");
      return;
    }
    setFactorId(fid);
  }, [searchParams, router]);

  // Timer para bloqueo
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0) {
      // Redirigir a login después del bloqueo
      router.push("/login?blocked=true");
    }
  }, [timeLeft, router]);

  const saveAttempts = useCallback((newAttempts: number) => {
    setAttempts(newAttempts);
    sessionStorage.setItem(SESSION_KEY, newAttempts.toString());
  }, []);

  const handleVerify = useCallback(async (codeToVerify: string) => {
    if (!factorId || codeToVerify.length !== 6) {
      setError("Ingresa el código de 6 dígitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        throw new Error("Error al crear el desafío");
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: codeToVerify,
      });

      if (verifyError) {
        const newAttempts = attempts + 1;
        saveAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setError(`Demasiados intentos (${MAX_ATTEMPTS}/3). Deberás esperar 30 segundos antes de reintentar.`);
          setTimeLeft(30);
          // Limpiar intentos después del bloqueo
          setTimeout(() => {
            saveAttempts(0);
            sessionStorage.removeItem(SESSION_KEY);
          }, 30000);
          return;
        }

        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(`Código inválido. Te quedan ${remaining} ${remaining === 1 ? "intento" : "intentos"}.`);
        setCode("");
        return;
      }

      // Éxito: limpiar intentos y redirigir
      sessionStorage.removeItem(SESSION_KEY);
      
      // Pequeño retraso para mostrar el éxito
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch {
      setError("Error inesperado. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [factorId, attempts, saveAttempts, router]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleVerify(code);
  }, [code, handleVerify]);

  // Auto-enviar cuando el código está completo
  const handleCodeComplete = useCallback(() => {
    if (code.length === 6 && !loading && !timeLeft) {
      handleVerify(code);
    }
  }, [code, loading, timeLeft, handleVerify]);

  if (!factorId) {
    return <LoadingSpinner message="Verificando autenticación..." />;
  }

  if (timeLeft !== null && timeLeft > 0) {
    return (
      <TwoFALayout
        title="Cuenta temporalmente bloqueada"
        description={`Demasiados intentos fallidos. Espera ${timeLeft} segundos para reintentar.`}
        icon="⏳"
      >
        <div className="text-center">
          <div className="text-4xl font-mono mb-4">{timeLeft}s</div>
          <a
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </TwoFALayout>
    );
  }

  return (
    <TwoFALayout
      title="Verificación en dos pasos"
      description="Ingresa el código de tu aplicación de autenticación"
      icon="🔐"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <CodeInput
          value={code}
          onChange={setCode}
          onComplete={handleCodeComplete}
          disabled={loading}
          autoFocus
        />

        {error && (
          <ErrorAlert 
            message={error} 
            onDismiss={() => setError(null)}
          />
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Verificando..." : "Verificar código"}
        </button>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Volver al inicio de sesión
          </a>
        </div>

        <div className="text-center pt-4 border-t border-border">
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-primary">
              ¿Perdiste acceso a tu app autenticadora?
            </summary>
            <p className="mt-2">
              Contacta al administrador del sistema para recuperar tu cuenta.
              Se requiere verificación adicional por seguridad.
            </p>
          </details>
        </div>
      </form>
    </TwoFALayout>
  );
}
