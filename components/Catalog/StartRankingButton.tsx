"use client";

import type { JSX } from "react";
import { Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type StartRankingButtonProps = Readonly<{
  selectedCount: number;
  isLoading: boolean;
  onClick: () => void;
}>;

export function StartRankingButton({
  selectedCount,
  isLoading,
  onClick,
}: StartRankingButtonProps): JSX.Element {
  return (
    <div className="absolute bottom-4 md:bottom-6 left-0 right-0 px-4 md:px-6 animate-in slide-in-from-bottom-4">
      <Button 
        onClick={onClick}
        disabled={isLoading}
        className="w-full bg-green-500 hover:bg-green-600 text-black font-mono py-4 md:py-6 rounded-xl shadow-lg shadow-green-900/20 text-base md:text-lg group flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Layers className="h-5 w-5 mr-2" />
        )}
        {isLoading ? "FETCHING TRACKS..." : "READY TO RANK?"}
        {!isLoading && (
          <span className="ml-1 px-2 py-0.5 bg-black/10 rounded-md text-xs">{selectedCount}</span>
        )}
      </Button>
    </div>
  );
}
