"use client";

import Image from "next/image";
import { useState } from "react";
import { Music } from "lucide-react";

export function CoverArt({ id, title, url, size = 250, className = "" }: { id: string, title: string, url?: string, size?: 250 | 500, className?: string }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const imageSrc = url || `https://coverartarchive.org/release-group/${id}/front-${size}`;

  return (
    <div className={`relative overflow-hidden bg-muted flex items-center justify-center ${className}`}>
      {!error ? (
        <Image
          src={imageSrc}
          alt={title}
          fill
          className={`object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
          unoptimized
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      ) : (
        <Music className="h-1/2 w-1/2 text-muted-foreground/40" />
      )}
      {loading && !error && (
        <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
      )}
    </div>
  );
}
