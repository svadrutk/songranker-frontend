import { RankingWidget } from "@/components/RankingWidget";
import { Suspense } from "react";
import { getSessionDetail } from "@/lib/api";
import type { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const session = await getSessionDetail(id, { includeComparisons: false });
  const previousImages = (await parent).openGraph?.images || [];

  if (!session) {
    return {
      title: "Ranking Not Found | Chorusboard",
    };
  }

  const title = session.playlist_name 
    ? `Ranking: ${session.playlist_name} | Chorusboard`
    : session.songs?.[0]?.artist 
      ? `Ranking: ${session.songs[0].artist} | Chorusboard`
      : "Music Ranking | Chorusboard";

  return {
    title,
    description: `Check out the results for this ranking on Chorusboard. ${session.songs?.length || 0} tracks ranked.`,
    openGraph: {
      title,
      images: session.image_url ? [session.image_url, ...previousImages] : previousImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: session.image_url ? [session.image_url] : [],
    },
  };
}

export default async function RankingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;

  return (
    <div className="h-full w-full overflow-hidden bg-background relative">
      <Suspense fallback={<RankingSkeleton />}>
        <RankingDataWrapper id={id} mode={mode} />
      </Suspense>
    </div>
  );
}

async function RankingDataWrapper({ id, mode }: { id: string; mode?: string }) {
  // Fetch session data on the server inside the Suspense boundary
  // We include comparisons so the widget can initialize its pairing history
  const session = await getSessionDetail(id, { includeComparisons: true });
  
  return (
    <RankingWidget
      isRanking={true}
      sessionId={id}
      initialMode={mode}
      initialData={session}
    />
  );
}

function RankingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-4">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Loading Ranking…
      </p>
    </div>
  );
}
