"use client";

import type { JSX } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SpeedLinesProps = Readonly<{
  side: "left" | "right";
}>;

export function SpeedLines({ side }: SpeedLinesProps): JSX.Element {
  const isLeft = side === "left";
  return (
    <div 
      className={cn(
        "absolute top-0 bottom-0 flex flex-col justify-center gap-1 md:gap-2 pointer-events-none",
        isLeft ? "-left-8 md:-left-12" : "-right-8 md:-right-12"
      )}
    >
      {[1, 2, 3].map((i) => (
        <motion.div
          key={`${side}-${i}`}
          className={cn("h-[1px] md:h-[2px] bg-primary/40 rounded-full", !isLeft && "ml-auto")}
          animate={{
            width: isLeft ? [8, 12, 18, 14, 10, 8] : [10, 14, 18, 12, 8, 10],
            opacity: isLeft ? [0.3, 0.5, 0.7, 0.5, 0.3] : [0.4, 0.6, 0.7, 0.5, 0.4],
            x: isLeft ? [0, -1, -2, -1, 0] : [0, 1, 2, 1, 0],
          }}
          transition={{
            duration: (isLeft ? 1.8 : 2.1) + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
