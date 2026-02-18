"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";

const ASSET_COUNT = 24;

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
  reverse = false,
  className = "",
}: { 
  images: string[], 
  duration: number, 
  reverse?: boolean,
  className?: string,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={`flex flex-col ${className}`}>
        {images.slice(0, 8).map((src, i) => (
          <Image
            key={i}
            src={src}
            alt="Receipt"
            width={1080}
            height={1200}
            className="w-full h-auto invert dark:invert-0"
            sizes="(max-width: 768px) 33vw, 20vw"
            priority={i < 2}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col relative h-full ${className}`}>
      <motion.div
        initial={{ y: reverse ? "-50%" : "0%" }}
        animate={{ y: reverse ? "0%" : "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex flex-col will-change-transform"
      >
        {images.map((src, i) => (
          <Image
            key={`set1-${i}`}
            src={src}
            alt="Receipt"
            width={1080}
            height={1200}
            className="w-full h-auto invert dark:invert-0"
            sizes="(max-width: 768px) 33vw, 20vw"
            priority={i < 2}
          />
        ))}
        {images.map((src, i) => (
          <Image
            key={`set2-${i}`}
            src={src}
            alt="Receipt"
            width={1080}
            height={1200}
            className="w-full h-auto invert dark:invert-0"
            sizes="(max-width: 768px) 33vw, 20vw"
          />
        ))}
      </motion.div>
    </div>
  );
};

export const ReceiptMarquee = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const columns = useMemo(() => {
    const allImages = Array.from({ length: ASSET_COUNT }, (_, i) => `/assets/marquee/receipt_${i}.webp`);
    
    const cols = [];
    for (let i = 0; i < 5; i++) {
      cols.push(shuffle(allImages.slice(i * 5, (i + 1) * 5)));
    }
    
    return cols;
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 select-none">
      <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60" />
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: "linear-gradient(to bottom, var(--background) 0%, transparent 10%, transparent 90%, var(--background) 100%)"
        }}
      />
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: "linear-gradient(to right, var(--background) 0%, transparent 5%, transparent 95%, var(--background) 100%)"
        }}
      />

      <div className="grid grid-cols-3 md:grid-cols-5 gap-0 h-[140%] -mt-[20%] w-[calc(100%+2rem)] -ml-4">
        {columns.map((col, i) => (
          <MarqueeColumn 
            key={i} 
            images={col} 
            duration={50 + (i * 10)} 
            reverse={i % 2 === 1} 
            className={i >= 3 ? "hidden md:flex" : ""}
          />
        ))}
      </div>
    </div>
  );
};
