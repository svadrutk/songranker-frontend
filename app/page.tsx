"use client";

import { SessionBuilder } from "@/components/SessionBuilder";
import { useAuth } from "@/components/AuthProvider";
import type { JSX } from "react";

export default function Home(): JSX.Element {
  const { user } = useAuth();
  
  return (
    <div key={user?.id || "guest"} className="flex h-full w-full overflow-hidden bg-background relative">
      {/* Main Content — now always full space */}
      <main
        className="flex-1 min-h-0 h-full overflow-hidden relative"
      >
        {/* Clean Minimalist Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-linear-to-br from-background via-background/50 to-primary/5" />
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <SessionBuilder />
      </main>
    </div>
  );
}
