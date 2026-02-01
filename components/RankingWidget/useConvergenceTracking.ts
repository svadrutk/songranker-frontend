import { useState, useEffect, useRef, useCallback } from "react";

// Smooth progress interpolation constants
const MAX_BOOST = 15;        // maximum boost above real convergence
const PROGRESS_CEILING = 89; // never fake past this to avoid false "stable" state

/**
 * Dynamic boost calculation based on pool size (Bradley-Terry scaling)
 * Larger pools need more duels to converge, so each duel contributes less
 */
function getBoostPerDuel(songCount: number): number {
  if (songCount <= 0) return 0;
  // 10 songs → ~5%, 30 songs → ~1.7%, 100 songs → ~0.5%
  return Math.max(0.5, Math.min(5, 50 / songCount));
}

type UseConvergenceTrackingOptions = {
  songCount: number;
  totalDuels: number;
  convergence: number;
};

type UseConvergenceTrackingReturn = {
  /** The display score including any perceived boost */
  displayScore: number;
  /** Whether to show the progress hint */
  showProgressHint: boolean;
  /** Add perceived progress boost after a duel */
  addPerceivedBoost: () => void;
  /** Reset perceived boost (e.g., when real convergence increases or on undo) */
  resetPerceivedBoost: () => void;
};

/**
 * Hook to manage convergence display with smooth progress interpolation.
 * Adds a "perceived boost" that gradually increases after each duel,
 * giving users feedback even when the real convergence score hasn't changed yet.
 */
export function useConvergenceTracking({
  songCount,
  totalDuels,
  convergence,
}: UseConvergenceTrackingOptions): UseConvergenceTrackingReturn {
  const [perceivedBoost, setPerceivedBoost] = useState(0);
  const [showProgressHint, setShowProgressHint] = useState(false);

  // Calculate quantity-based progress
  const quantityTarget = Math.max(1, songCount * 1.5);
  const quantityProgress = Math.min(100, (totalDuels / quantityTarget) * 100);
  const optimisticMin = Math.min(40, quantityProgress);
  
  // Smooth progress interpolation: add perceived boost when convergence is stalled
  const baseScore = Math.max(convergence, optimisticMin);
  const maxBoost = Math.max(0, Math.min(MAX_BOOST, PROGRESS_CEILING - baseScore));
  const displayScore = baseScore + Math.min(perceivedBoost, maxBoost);

  // Show hint when stuck at 40%
  useEffect(() => {
    if (displayScore === 40 && quantityProgress >= 40) {
      const timer = setTimeout(() => setShowProgressHint(true), 4000);
      return () => clearTimeout(timer);
    } else {
      // Use timeout to avoid synchronous setState in effect
      const timer = setTimeout(() => setShowProgressHint(false), 0);
      return () => clearTimeout(timer);
    }
  }, [displayScore, quantityProgress]);

  const addPerceivedBoost = useCallback(() => {
    setPerceivedBoost((prev) => prev + getBoostPerDuel(songCount));
  }, [songCount]);

  const resetPerceivedBoost = useCallback(() => {
    setPerceivedBoost(0);
  }, []);

  return {
    displayScore,
    showProgressHint,
    addPerceivedBoost,
    resetPerceivedBoost,
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
