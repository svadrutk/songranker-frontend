"use client";

import { AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

let showErrorFn: ((message: string) => void) | null = null;

export function showError(message: string) {
  if (showErrorFn) {
    showErrorFn(message);
  }
}

export function ErrorBanner() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    showErrorFn = setError;
    return () => {
      showErrorFn = null;
    };
  }, []);

  if (!error) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full mx-4">
      <div className="bg-destructive/90 text-white p-4 rounded-lg shadow-2xl flex items-start gap-3 backdrop-blur-sm animate-in slide-in-from-top-4 fade-in duration-300">
        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm mb-1">API Error</p>
          <p className="text-xs opacity-90 break-words">{error}</p>
        </div>
        <button
          onClick={() => setError(null)}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
