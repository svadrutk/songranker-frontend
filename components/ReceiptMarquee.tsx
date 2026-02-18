"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";

const ASSET_COUNT = 24;

// Helper to shuffle array for varied columns
const shuffle = (array: string[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const MarqueeColumn = ({ 
  images, 
  duration, 
  reverse = false 
}: { 
  images: string[], 
  duration: number, 
  reverse?: boolean 
}) => {
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, we just show a static list
  if (shouldReduceMotion) {
    return (
      <div className="flex flex-col gap-4 py-4">
        {images.slice(0, 8).map((src, i) => (
          <div key={i} className="relative aspect-[1080/1200] w-full rounded-sm overflow-hidden shadow-2xl border border-white/5">
            <Image
              src={src}
              alt="Receipt"
              fill
              className="object-cover"
              sizes="400px"
              priority={i < 2}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 relative h-full overflow-hidden">
      <motion.div
        initial={{ y: reverse ? "-50%" : "0%" }}
        animate={{ y: reverse ? "0%" : "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex flex-col gap-4 will-change-transform"
      >
        {/* First Set */}
        {images.map((src, i) => (
          <div key={`set1-${i}`} className="relative aspect-[1080/1200] w-full rounded-sm overflow-hidden shadow-2xl border border-white/5 group transition-transform duration-500 hover:scale-[1.02]">
            <Image
              src={src}
              alt="Receipt"
              fill
              className="object-cover"
              sizes="400px"
              priority={i < 2}
            />
          </div>
        ))}
        {/* Duplicate Set for Seamless Loop */}
        {images.map((src, i) => (
          <div key={`set2-${i}`} className="relative aspect-[1080/1200] w-full rounded-sm overflow-hidden shadow-2xl border border-white/5">
            <Image
              src={src}
              alt="Receipt"
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export const ReceiptMarquee = () => {
  const columns = useMemo(() => {
    const allImages = Array.from({ length: ASSET_COUNT }, (_, i) => `/assets/marquee/receipt_${i}.webp`);
    
    // Distribute images into columns with different shuffles
    const col1 = shuffle(allImages.slice(0, 8));
    const col2 = shuffle(allImages.slice(8, 16));
    const col3 = shuffle(allImages.slice(16, 24));
    
    return [col1, col2, col3];
  }, []);

  if (columns.length === 0) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20 select-none">
      {/* Top/Bottom Fade Mask */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: "linear-gradient(to bottom, var(--background) 0%, transparent 15%, transparent 85%, var(--background) 100%)"
        }}
      />
      
      {/* Left/Right Fade Mask */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: "linear-gradient(to right, var(--background) 0%, transparent 5%, transparent 95%, var(--background) 100%)"
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[120%] -mt-[10%] px-4">
        <MarqueeColumn images={columns[0]} duration={60} />
        <div className="hidden md:block">
          <MarqueeColumn images={columns[1]} duration={85} reverse />
        </div>
        <div className="hidden lg:block">
          <MarqueeColumn images={columns[2]} duration={70} />
        </div>
      </div>
    </div>
  );
};
