"use client";

import { useState, type JSX } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyLinkButtonProps = {
  url: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
};

export function CopyLinkButton({ 
  url, 
  className, 
  variant = "outline", 
  size = "default",
  showLabel = true 
}: CopyLinkButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={cn(
        "font-mono uppercase tracking-wider text-xs md:text-sm font-bold transition-all",
        copied ? "text-green-500 border-green-500/50 bg-green-500/5" : "",
        className
      )}
      title="Copy link to clipboard"
    >
      {copied ? (
        <Check className={cn("h-3.5 w-3.5 md:h-4 md:w-4 shrink-0", showLabel && "mr-1.5 md:mr-2")} />
      ) : (
        <Link2 className={cn("h-3.5 w-3.5 md:h-4 md:w-4 shrink-0", showLabel && "mr-1.5 md:mr-2")} />
      )}
      {showLabel && (
        <span className="truncate">{copied ? "Copied!" : "Copy Link"}</span>
      )}
    </Button>
  );
}
