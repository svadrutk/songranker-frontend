"use client";

import { useState } from "react";
import { Check, X, Merge, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DuplicateGroup } from "@/lib/deduplication";

interface DeduplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mergedSongs: string[]) => void;
  duplicateGroups: DuplicateGroup[];
  allSongs: string[];
}

export function DeduplicationModal({
  isOpen,
  onClose,
  onConfirm,
  duplicateGroups,
  allSongs,
}: DeduplicationModalProps) {
  const [resolutions, setResolutions] = useState<Record<number, boolean>>(() =>
    duplicateGroups.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
  );

  const toggleResolution = (idx: number) => {
    setResolutions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleConfirm = () => {
    const indicesToRemove = new Set(
      duplicateGroups
        .filter((_, idx) => resolutions[idx])
        .flatMap(group => group.matchIndices.slice(1))
    );

    onConfirm(allSongs.filter((_, idx) => !indicesToRemove.has(idx)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-muted/20">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-mono uppercase tracking-tight flex items-center gap-2">
              <Merge className="h-5 w-5 text-green-500" />
              Review Duplicates
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              We found {duplicateGroups.length} potential duplicate groups.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Check className="h-12 w-12 text-green-500 mx-auto opacity-20" />
              <p className="text-sm font-mono text-muted-foreground">No duplicates found! You&apos;re good to go.</p>
            </div>
          ) : (
            duplicateGroups.map((group, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border transition-all ${
                  resolutions[idx] ? "bg-green-500/5 border-green-500/20" : "bg-muted/30 border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted uppercase tracking-widest">
                        Group {idx + 1}
                      </span>
                      {group.confidence < 100 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 uppercase tracking-widest border border-yellow-500/20">
                          {group.confidence}% Match
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        {group.canonical}
                      </p>
                      <div className="pl-5 space-y-1 opacity-60">
                        {group.matches.slice(1).map((m, i) => (
                          <p key={i} className="text-xs font-mono line-through decoration-muted-foreground">
                            {m}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => toggleResolution(idx)}
                    variant="outline"
                    className={`h-auto py-2 px-4 rounded-lg font-mono text-[10px] uppercase font-bold transition-all ${
                      resolutions[idx] 
                        ? "border-green-500/50 bg-green-500/10 text-green-500 hover:bg-green-500/20" 
                        : "border-muted-foreground/30 hover:bg-muted"
                    }`}
                  >
                    {resolutions[idx] ? (
                      <span className="flex items-center gap-2"><Merge className="h-3 w-3" /> Merging</span>
                    ) : (
                      <span className="flex items-center gap-2"><Split className="h-3 w-3" /> Keeping Both</span>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t bg-muted/20 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 py-6 font-mono font-bold uppercase tracking-widest text-xs">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="flex-1 py-6 bg-green-500 hover:bg-green-600 text-black font-mono font-bold uppercase tracking-widest text-xs"
          >
            Confirm & Start Ranking
          </Button>
        </div>
      </div>
    </div>
  );
}
