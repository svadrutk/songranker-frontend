"use client";

import { SessionBuilder } from "@/components/SessionBuilder";
import { useAuth } from "@/components/AuthProvider";
import { LandingPage } from "@/components/LandingPage";
import type { JSX } from "react";

export default function Home(): JSX.Element {
  const { user, openAuthModal } = useAuth();

  if (!user) {
    return <LandingPage key="guest" openAuthModal={openAuthModal} />;
  }

  return (
    <div key={user.id} className="flex h-full w-full overflow-hidden bg-background relative">
      <main className="flex-1 min-h-0 h-full overflow-hidden relative">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-20 transition-opacity duration-1000">
          <div className="absolute inset-0 bg-linear-to-br from-background via-background/50 to-primary/5" />
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <SessionBuilder />
      </main>
    </div>
  );
}
