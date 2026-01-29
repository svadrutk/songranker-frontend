"use client";

import { useState } from "react";
import { Bug } from "lucide-react";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-20 md:left-4 z-[70]">
        <button
          onClick={() => setIsOpen(true)}
          className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors"
          aria-label="Send feedback"
        >
          <Bug className="h-5 w-5 text-black" />
        </button>
      </div>
      
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
