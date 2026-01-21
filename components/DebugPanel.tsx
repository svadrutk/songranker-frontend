"use client";

import { useState } from "react";
import { Bug } from "lucide-react";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-20 left-4 z-[70]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors"
      >
        <Bug className="h-5 w-5 text-black" />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-card border border-border rounded-lg p-4 shadow-xl text-xs font-mono">
          <h3 className="font-bold mb-2 text-foreground">Debug Info</h3>
          <div className="space-y-1 text-muted-foreground">
            <p><span className="text-yellow-500">Backend URL:</span> {backendUrl}</p>
            <p><span className="text-yellow-500">User Agent:</span> {navigator.userAgent}</p>
            <p><span className="text-yellow-500">Screen:</span> {window.innerWidth}x{window.innerHeight}</p>
          </div>
        </div>
      )}
    </div>
  );
}
