"use client";

import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Leaderboard } from "@/components/Leaderboard";
import type { SessionSong } from "@/lib/api";

type LeaderboardPreviewModalProps = Readonly<{
  isOpen: boolean;
  songs: SessionSong[];
  onClose: () => void;
}>;

export function LeaderboardPreviewModal({
  isOpen,
  songs,
  onClose,
}: LeaderboardPreviewModalProps): JSX.Element {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full h-full max-w-xl bg-background border border-primary/10 rounded-[2rem] shadow-2xl overflow-hidden relative"
          >
            <Leaderboard 
              songs={songs} 
              onContinue={onClose} 
              isPreview 
            />
            <div className="absolute top-4 right-4 z-50">
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
