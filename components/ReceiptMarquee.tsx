"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const ASSET_COUNT = 24;
const ALL_IMAGES = Array.from({ length: ASSET_COUNT }, (_, i) => `/assets/marquee/receipt_${i}.webp`);

export const ReceiptMarquee = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 select-none">
      <div className="absolute inset-0 z-10 bg-black/60" />
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: "linear-gradient(to bottom, var(--background) 0%, transparent 10%, transparent 90%, var(--background) 100%), linear-gradient(to right, var(--background) 0%, transparent 5%, transparent 95%, var(--background) 100%)"
        }}
      />

      <div className="grid grid-cols-5 gap-0 h-[140%] -mt-[20%] w-full">
        {Array.from({ length: 5 }).map((_, colIndex) => {
          const images = ALL_IMAGES.filter((_, i) => i % 5 === colIndex);
          const reverse = colIndex % 2 === 1;
          const duration = 50 + (colIndex * 10);
          
          return (
            <div key={colIndex} className="flex flex-col relative h-full">
              <motion.div
                initial={{ y: reverse ? "-50%" : "0%" }}
                animate={shouldReduceMotion ? {} : { y: reverse ? "0%" : "-50%" }}
                transition={{ duration, repeat: Infinity, ease: "linear" }}
                className="flex flex-col gap-10 will-change-transform grayscale invert brightness-110"
                style={{ paddingBottom: "2.5rem" }}
              >
                {[...images, ...images].map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt="Receipt"
                    width={800}
                    height={1000}
                    className="w-full h-auto"
                    sizes="20vw"
                    priority={i < 2}
                  />
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
