"use client";

import { AnalyticsPage } from "@/components/AnalyticsPage";
import { useAuth } from "@/components/AuthProvider";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Analytics() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      redirect("/");
    }
  }, [user, loading]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="flex flex-col min-h-0 h-full w-full overflow-hidden px-4 md:px-8">
      <AnalyticsPage isSidebarCollapsed={true} />
    </div>
  );
}
