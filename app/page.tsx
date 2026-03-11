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
    <div key={user.id} className="h-full w-full overflow-hidden bg-background">
      <SessionBuilder />
    </div>
  );
}
