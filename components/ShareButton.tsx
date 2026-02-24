"use client";

import { useState, useRef, useEffect, useCallback, type JSX } from "react";
import { Share2, Loader2, Link2, Ticket, Check, ChevronDown } from "lucide-react";
import confetti from "canvas-confetti";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { SessionSong } from "@/lib/api";
import { generateShareImage } from "@/lib/share-actions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ShareButtonProps = {
  songs?: SessionSong[];
  sessionId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
};

export function ShareButton({ 
  songs = [], 
  sessionId,
  className,
  variant = "default",
  size = "default",
  showLabel = true
}: ShareButtonProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const resultsUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ranking/${sessionId}?mode=results`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    if (size === "icon") {
      setDropdownPos({ top: rect.top, left: rect.right - 192, width: 192 });
    } else {
      setDropdownPos({ top: rect.top, left: rect.left, width: rect.width });
    }
  }, [size]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(resultsUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleGenerateReceipt = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isGenerating || songs.length === 0) return;
    
    setIsGenerating(true);
    setIsOpen(false);

    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        month: "2-digit", day: "2-digit", year: "2-digit",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour12: false, hour: "2-digit", minute: "2-digit",
      });
      
      const orderId = Math.floor(Math.random() * 9000) + 1000;
      const result = await generateShareImage(songs, orderId, dateStr, timeStr);

      if (!result.success) throw new Error(result.error);

      const binaryString = atob(result.imageData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      const file = new File([blob], "my-top-10.png", { type: "image/png" });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#ffffff"],
      });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Top 10 Songs",
          text: "Check out my definitive top 10 songs on Song Ranker!",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "my-top-10.png";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to generate share image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const dropdown = (
    <AnimatePresence>
      {isOpen && dropdownPos && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="fixed z-[9999] origin-bottom overflow-hidden rounded-xl border border-border/40 bg-card p-1 shadow-2xl backdrop-blur-md"
          style={{
            top: dropdownPos.top - 4,
            left: dropdownPos.left,
            width: dropdownPos.width,
            transform: "translateY(-100%)",
          }}
        >
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-muted/50 transition-colors",
              copied && "text-green-500 border-green-500/20 bg-green-500/10"
            )}>
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black font-mono uppercase tracking-widest leading-none mb-1">
                {copied ? "Copied" : "Copy Link"}
              </span>
              <span className="text-[9px] font-medium text-muted-foreground/60 font-mono uppercase">
                Share direct results
              </span>
            </div>
          </button>

          <button
            onClick={handleGenerateReceipt}
            disabled={songs.length === 0}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
              songs.length > 0 ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-muted/50">
              <Ticket className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black font-mono uppercase tracking-widest leading-none mb-1">
                Receipt
              </span>
              <span className="text-[9px] font-medium text-muted-foreground/60 font-mono uppercase">
                Generate shareable image
              </span>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isGenerating}
        variant={variant}
        size={size}
        className={cn(
          "font-mono uppercase tracking-wider text-xs md:text-sm font-bold transition-all duration-300",
          isOpen && "ring-2 ring-primary/20",
          size === "icon" ? "h-9 w-9 p-0" : "w-full h-12"
        )}
      >
        {isGenerating ? (
          <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin shrink-0" />
        ) : (
          <Share2 className={cn("h-3.5 w-3.5 md:h-4 md:w-4 shrink-0", showLabel && "mr-1.5 md:mr-2")} />
        )}
        {showLabel && (
          <>
            <span className="truncate">{isGenerating ? "Generating..." : "Share Rankings"}</span>
            <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform duration-300", isOpen && "rotate-180")} />
          </>
        )}
      </Button>

      {isMounted ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
