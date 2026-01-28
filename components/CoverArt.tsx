"use client";

import Image from "next/image";
import { useState } from "react";
import { Music } from "lucide-react";

type CoverArtProps = Readonly<{
  id?: string;
  title: string;
  url?: string | null;
  spotifyId?: string | null;
  size?: 250 | 500;
  className?: string;
}>;

export function CoverArt({
  id,
  title,
  url,
  spotifyId,
  size = 250,
  className = "",
}: CoverArtProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Priority:
  // 1. Explicitly provided URL
  // 2. Spotify Image URL (if spotifyId available)
  // 3. CAA Fallback (if id/mbid available)
  const imageSrc =
    url ||
    (spotifyId ? `https://i.scdn.co/image/${spotifyId}` : null) ||
    (id ? `https://coverartarchive.org/release-group/${id}/front-${size}` : null);

  if (!imageSrc || error) {
    return (
      <div
        className={`relative overflow-hidden bg-muted flex items-center justify-center ${className}`}
      >
        <Music className="h-1/2 w-1/2 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-muted flex items-center justify-center ${className}`}>
      <Image
        src={imageSrc}
        alt={title}
        fill
        className={`object-cover transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        unoptimized
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
      )}
    </div>
  );
}
