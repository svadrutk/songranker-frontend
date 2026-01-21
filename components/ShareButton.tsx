"use client";

import { useState, type JSX } from "react";
import { Share2, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import type { SessionSong } from "@/lib/api";

type ShareButtonProps = {
  songs: SessionSong[];
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function ShareButton({ songs }: ShareButtonProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (isGenerating) return;
    
    console.log('[ShareButton] Button clicked, starting generation...');
    setIsGenerating(true);

    try {
      console.log('[ShareButton] Preparing request data...');
      // Prepare data for backend
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      
      // Random order ID (or could be session ID based if we had it)
      const orderId = Math.floor(Math.random() * 9000) + 1000;

      console.log(`[ShareButton] Fetching from: ${BACKEND_URL}/generate-receipt`);
      console.log(`[ShareButton] Sending ${songs.length} songs`);
      
      const response = await fetch(`${BACKEND_URL}/generate-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          songs, 
          orderId, 
          dateStr, 
          timeStr 
        }),
      });

      console.log(`[ShareButton] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ShareButton] Error response: ${errorText}`);
        throw new Error(`Failed to generate image: ${response.statusText}`);
      }

      console.log('[ShareButton] Converting response to blob...');
      const blob = await response.blob();
      console.log(`[ShareButton] Blob size: ${blob.size} bytes`);
      const file = new File([blob], "my-top-10.png", { type: "image/png" });

      // Trigger confetti
      console.log('[ShareButton] Triggering confetti...');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#ffffff"],
      });

      // Check for Web Share API
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Top 10 Songs",
          text: "Check out my definitive top 10 songs on Song Ranker!",
        });
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "my-top-10.png";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("[ShareButton] Failed to generate share image:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('[ShareButton] Finished, resetting state');
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isGenerating}
      className="px-8 md:px-12 py-5 md:py-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-mono uppercase tracking-widest text-[10px] md:text-xs font-black group relative overflow-hidden"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
      )}
      {isGenerating ? "Generating..." : "Share Rankings"}
      
      {!isGenerating && (
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      {isGenerating && (
        <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
      )}
    </Button>
  );
}
