"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type UseConvergenceTrackingOptions = {
  convergence: number;
};

type UseConvergenceTrackingReturn = {
  /** The display score (just the real convergence) */
  displayScore: number;
};

/**
 * Hook to manage convergence display.
 * Simply returns the real convergence score from the backend.
 */
export function useConvergenceTracking({
  convergence,
}: UseConvergenceTrackingOptions): UseConvergenceTrackingReturn {
  return {
    displayScore: convergence,
  };
}

/**
 * Hook to track window focus/blur and adjust timing accordingly.
 * Used to pause the decision timer when the user switches away.
 */
export function useWindowFocusTimer() {
  const lastPairLoadTime = useRef<number | null>(null);
  const blurTimeRef = useRef<number | null>(null);
  const peekTimeRef = useRef<number | null>(null);

  // Initialize on first access to avoid impure function call during render
  const getLastPairLoadTime = () => {
    if (lastPairLoadTime.current === null) {
      lastPairLoadTime.current = Date.now();
    }
    return lastPairLoadTime.current;
  };

  useEffect(() => {
    const handleBlur = () => {
      blurTimeRef.current = Date.now();
    };
    const handleFocus = () => {
      if (blurTimeRef.current && lastPairLoadTime.current !== null) {
        const pauseDuration = Date.now() - blurTimeRef.current;
        lastPairLoadTime.current += pauseDuration;
        blurTimeRef.current = null;
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const resetTimer = useCallback(() => {
    lastPairLoadTime.current = Date.now();
  }, []);

  const getDecisionTime = useCallback(() => {
    return Date.now() - getLastPairLoadTime();
  }, []);

  const startPeekPause = useCallback(() => {
    peekTimeRef.current = Date.now();
  }, []);

  const endPeekPause = useCallback(() => {
    if (peekTimeRef.current && lastPairLoadTime.current !== null) {
      const peekDuration = Date.now() - peekTimeRef.current;
      lastPairLoadTime.current += peekDuration;
      peekTimeRef.current = null;
    }
  }, []);

  return {
    resetTimer,
    getDecisionTime,
    startPeekPause,
    endPeekPause,
  };
}

/**
 * Hook to show a temporary notification that auto-dismisses.
 */
export function useTimedNotification(durationMs: number = 4000) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(true);
    timerRef.current = setTimeout(() => {
      if (isMountedRef.current) setIsVisible(false);
    }, durationMs);
  }, [durationMs]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  }, []);

  return { isVisible, show, hide };
}
