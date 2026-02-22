import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Selection | Chorusboard",
  description: "Confirm your tracks before starting your ranking session.",
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
