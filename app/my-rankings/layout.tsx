import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Rankings | Chorusboard",
  description: "Manage your music ranking sessions. View, share, or delete your previous rankings.",
};

export default function MyRankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
