"use client";

import type { JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartNetwork } from "lucide-react";

type RankUpdateNotificationProps = Readonly<{
  isVisible: boolean;
}>;

export function RankUpdateNotification({ isVisible }: RankUpdateNotificationProps): JSX.Element {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20, scale: 0.98 }}
          className="fixed top-16 md:top-20 right-4 md:right-8 z-50 flex items-center gap-4 px-6 py-4 rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-white/10 backdrop-blur-md"
        >
          <ChartNetwork className="h-5 w-5 text-primary/80" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-mono font-black uppercase tracking-[0.15em] leading-none">
              Rankings Refined
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
              Model synchronization complete
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
