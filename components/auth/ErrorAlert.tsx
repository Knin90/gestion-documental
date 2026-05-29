"use client";

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div 
      role="alert" 
      className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start justify-between gap-2"
    >
      <span>{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-destructive hover:text-destructive/80"
          aria-label="Cerrar error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
