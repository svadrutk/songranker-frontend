import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stats & Insights | Chorusboard",
  description: "Global and personal music ranking analytics. See how your favorites stack up against the world.",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
