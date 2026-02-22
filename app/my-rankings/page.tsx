"use client";

import { MyRankingsOverview } from "@/components/MyRankingsOverview";
import { useAuth } from "@/components/AuthProvider";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function MyRankings() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      redirect("/");
    }
  }, [user, loading]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="flex flex-col min-h-0 h-full w-full py-4 md:py-8 overflow-y-auto px-4 md:px-8">
      <MyRankingsOverview isSidebarCollapsed={true} onSessionDelete={() => {}} />
    </div>
  );
}
