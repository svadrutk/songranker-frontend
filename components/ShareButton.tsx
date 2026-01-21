"use client";

import { useState, useRef, type JSX } from "react";
import { Share2, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { ShareVisual } from "./ShareVisual";
import type { SessionSong } from "@/lib/api";

type ShareButtonProps = {
  songs: SessionSong[];
};

export function ShareButton({ songs }: ShareButtonProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localSongs, setLocalSongs] = useState<SessionSong[]>(songs);
  
  // Stable refs for export metadata
  const metadataRef = useRef({
    orderId: 0,
    dateStr: "",
    timeStr: ""
  });

  const prepareImages = async () => {
    const updatedSongs = await Promise.all(
      songs.map(async (song) => {
        if (!song.cover_url || song.cover_url.startsWith('blob:')) return song;
        
        try {
          const response = await fetch(song.cover_url, { mode: 'cors' });
          if (!response.ok) throw new Error('Failed to fetch image');
          const blob = await response.blob();
          const localUrl = URL.createObjectURL(blob);
          return { ...song, cover_url: localUrl };
        } catch (error) {
          console.error(`Failed to load image for ${song.name}:`, error);
          return song;
        }
      })
    );
    setLocalSongs(updatedSongs);
    return updatedSongs;
  };

  const handleShare = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    // Set stable metadata for this specific share action
    const now = new Date();
    const seed = songs.length > 0 ? songs[0].song_id.length : 1234;
    metadataRef.current = {
      orderId: Math.floor((Math.sin(seed) * 0.5 + 0.5) * 9000) + 1000,
      dateStr: now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
      timeStr: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    };

    let preparedSongs: SessionSong[] = [];

    try {
      // 1. Prepare images
      preparedSongs = await prepareImages();
      
      // 2. Wait for fonts and images to be fully ready
      await document.fonts.ready;
      
      const element = document.getElementById("share-visual");
      if (!element) throw new Error("Share visual element not found");

      // 3. Ensure all images inside the element are loaded
      const images = Array.from(element.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // 4. Cap pixel ratio for mobile to prevent crashes/missing images
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const pixelRatio = isMobile ? 2 : 3;

      const dataUrl = await toPng(element, {
        quality: 1.0,
        cacheBust: true,
        pixelRatio,
        height: element.scrollHeight,
        width: 1080,
        style: {
          transform: "scale(1)",
          left: "0",
          top: "0",
        }
      });

      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#ffffff"],
      });

      // Convert dataUrl to blob for sharing
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "song-ranker-top-10.png", { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Top 10 Songs",
          text: "My definitive rankings from SongRanker.app",
        });
      } else {
        const link = document.createElement("a");
        link.download = "song-ranker-top-10.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Failed to generate share image:", error);
    } finally {
      // Robust cleanup of blob URLs to prevent memory leaks
      preparedSongs.forEach(song => {
        if (song.cover_url?.startsWith('blob:')) {
          URL.revokeObjectURL(song.cover_url);
        }
      });
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={isGenerating}
        className="px-8 md:px-12 py-5 md:py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-widest text-[10px] md:text-xs font-black group relative overflow-hidden"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
        )}
        {isGenerating ? "Exporting..." : "Export Rankings"}
        
        {!isGenerating && (
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </Button>

      {/* Hidden container for image generation */}
      <div 
        className="fixed pointer-events-none overflow-hidden" 
        style={{ left: '-9999px', top: '0', width: '1080px' }} 
        aria-hidden="true"
      >
        <ShareVisual 
          songs={localSongs} 
          orderId={metadataRef.current.orderId}
          dateStr={metadataRef.current.dateStr}
          timeStr={metadataRef.current.timeStr}
        />
      </div>
    </>
  );
}
