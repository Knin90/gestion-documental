"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { TwoFALayout } from "@/components/auth/TwoFALayout";
import { CodeInput } from "@/components/auth/CodeInput";
import { ErrorAlert } from "@/components/auth/ErrorAlert";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";

const MAX_ATTEMPTS = 3;
const SESSION_KEY = "2fa_attempts";

function Verificar2FAContent() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update factorId from searchParams
  useEffect(() => {
    const id = searchParams.get("factorId");
    setFactorId(id);
  }, [searchParams]);

  // Initialize session state
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const { count, blockedUntil } = JSON.parse(stored);
        const now = Date.now();
        if (blockedUntil && now < blockedUntil) {
          setAttempts(MAX_ATTEMPTS);
          setTimeLeft(Math.ceil((blockedUntil - now) / 1000));
        } else {
          setAttempts(count ?? 0);
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        const next = t - 1;
        if (next <= 0) {
          setAttempts(0);
          sessionStorage.removeItem(SESSION_KEY);
          return null;
        }
        return next;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  const handleVerify = useCallback(
    async (codeToVerify: string) => {
      if (!factorId || loading) return;
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: challenge, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId });

        if (challengeError || !challenge) {
          setError("No se pudo iniciar la verificación. Intenta de nuevo.");
          return;
        }

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code: codeToVerify,
        });

        if (verifyError) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);

          if (newAttempts >= MAX_ATTEMPTS) {
            const blockedUntil = Date.now() + 30000;
            sessionStorage.setItem(
              SESSION_KEY,
              JSON.stringify({ count: newAttempts, blockedUntil })
            );
            setTimeLeft(30);
            setError("Demasiados intentos. Espera 30 segundos.");
          } else {
            sessionStorage.setItem(
              SESSION_KEY,
              JSON.stringify({ count: newAttempts, blockedUntil: null })
            );
            setError(
              `El código no es válido. Intento ${newAttempts} de ${MAX_ATTEMPTS}.`
            );
          }
          return;
        }

        sessionStorage.removeItem(SESSION_KEY);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    },
    [factorId, loading, attempts, router]
  );

  const handleCodeComplete = useCallback(
    (value: string) => {
      setCode(value);
      if (value.length === 6) handleVerify(value);
    },
    [handleVerify]
  );

  if (!factorId) {
    return (
      <TwoFALayout
        title="Error"
        description="No se encontró el factor de autenticación."
        icon="⚠️"
      >
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login?nosplash=1";
          }}
          style={{
            color: "#48A89A",
            textDecoration: "underline",
            fontSize: "0.875rem",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Volver al login
        </button>
      </TwoFALayout>
    );
  }

  return (
    <TwoFALayout
      title="Verificación de seguridad"
      description="Ingresa el código de 6 dígitos de tu app de autenticación."
      icon="🔐"
    >
      {loading ? (
        <LoadingSpinner message="Verificando..." />
      ) : timeLeft !== null ? (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "#dc2626",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            Demasiados intentos fallidos.
          </p>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            Espera <strong>{timeLeft}</strong> segundos antes de intentar de
            nuevo.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          )}
          <CodeInput
            value={code}
            onChange={handleCodeComplete}
            disabled={loading}
          />
          <p
            style={{
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
              marginTop: "0.5rem",
            }}
          >
          </p>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/login?nosplash=1";
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
              textDecoration: "underline",
              marginTop: "1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Volver al login
          </button>
        </>
      )}
    </TwoFALayout>
  );
}

export default function Verificar2FA() {
  return (
    <Suspense fallback={<LoadingSpinner message="Cargando..." />}>
      <Verificar2FAContent />
    </Suspense>
  );
}
