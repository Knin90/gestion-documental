"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { TwoFALayout } from "@/components/auth/TwoFALayout";
import { CodeInput } from "@/components/auth/CodeInput";
import { ErrorAlert } from "@/components/auth/ErrorAlert";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";

type SetupStep = "loading" | "qr" | "verify" | "success";

export default function Configurar2FAPage() {
  const [step, setStep] = useState<SetupStep>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function enrollFactor() {
      try {
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        const friendlyName = user?.email 
          ? `2FA-${user.email.split('@')[0]}` 
          : `2FA-${Date.now()}`;

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName,
        });

        if (error) throw error;
        if (!isMounted) return;

        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep("qr");
      } catch {
        if (isMounted) {
          setError("No se pudo iniciar la configuración. Recarga la página.");
          setStep("loading");
        }
      }
    }

    enrollFactor();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleVerify = useCallback(async (codeToVerify: string) => {
    if (!factorId || codeToVerify.length !== 6) {
      setError("Ingresa el código de 6 dígitos");
      return false;
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
        const newRetry = retryCount + 1;
        setRetryCount(newRetry);
        
        if (newRetry >= 3) {
          setError("Demasiados intentos fallidos. Vuelve a escanear el código QR.");
          setStep("qr");
          setCode("");
          setRetryCount(0);
          return false;
        }
        
        setError(`Código incorrecto. Intento ${newRetry} de 3.`);
        setCode("");
        return false;
      }

      setStep("success");
      return true;
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [factorId, retryCount]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleVerify(code);
  }, [code, handleVerify]);

  const handleCodeComplete = useCallback(() => {
    if (code.length === 6 && !loading) {
      handleVerify(code);
    }
  }, [code, loading, handleVerify]);

  const copySecret = useCallback(() => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      const toast = document.createElement("div");
      toast.textContent = "Clave copiada";
      toast.className = "fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm z-50 animate-fade-out";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  }, [secret]);

  if (step === "loading") {
    return <LoadingSpinner message="Preparando configuración de seguridad..." />;
  }

  if (step === "success") {
    return (
      <TwoFALayout
        title="¡Autenticación en dos pasos activada!"
        description="Tu cuenta está más segura. Ahora necesitarás tu código TOTP para iniciar sesión."
        icon="✅"
      >
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <p className="text-sm text-green-800 dark:text-green-300">
              ✨ Guarda tu código de respaldo en un lugar seguro
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Si pierdes tu dispositivo, necesitarás ayuda del administrador para recuperar tu cuenta.
            </p>
          </div>
          
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          >
            Ir al dashboard
          </button>
        </div>
      </TwoFALayout>
    );
  }

  if (step === "qr") {
    return (
      <TwoFALayout
        title="Configurar autenticación en dos pasos"
        description="Escanea el código QR con Google Authenticator o Microsoft Authenticator"
        icon="📱"
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            {qrCode && (
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <img 
                  src={qrCode} 
                  alt="Código QR para configurar 2FA" 
                  className="w-48 h-48"
                />
              </div>
            )}
          </div>

          {secret && (
            <div className="bg-muted p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Si no puedes escanear el código, usa esta clave secreta:
              </p>
              <code className="text-sm font-mono break-all bg-background px-2 py-1 rounded">
                {secret}
              </code>
              <button
                onClick={copySecret}
                className="block w-full text-xs text-primary hover:underline mt-2"
              >
                📋 Copiar clave secreta
              </button>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 Instrucciones:
            </p>
            <ol className="text-xs text-blue-700 dark:text-blue-400 list-decimal list-inside mt-1 space-y-1">
              <li>Descarga Google Authenticator o Microsoft Authenticator</li>
              <li>Abre la app y toca "+" para agregar una cuenta</li>
              <li>Selecciona "Escanear código QR"</li>
              <li>Apunta la cámara a este código</li>
            </ol>
          </div>

          <button
            onClick={() => setStep("verify")}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          >
            Ya escaneé, continuar →
          </button>

          <div className="text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Cancelar y volver al login
            </button>
          </div>
        </div>
      </TwoFALayout>
    );
  }

  return (
    <TwoFALayout
      title="Verificar configuración"
      description="Ingresa el código de 6 dígitos que muestra tu aplicación"
      icon="✓"
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
          {loading ? "Verificando..." : "Verificar y activar"}
        </button>

        <button
          type="button"
          onClick={() => setStep("qr")}
          className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Volver al código QR
        </button>
      </form>
    </TwoFALayout>
  );
}
