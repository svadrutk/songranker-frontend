"use client";

import { ReviewView } from "@/components/SessionBuilder";
import { useRouter } from "next/navigation";
import { useCallback, useState, type JSX } from "react";
import { createSession, type SongInput } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

export default function ReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRankingSession = useCallback(
    async (songs: SongInput[]) => {
      setIsCreatingSession(true);
      setError(null);

      try {
        const session = await createSession({
          user_id: user?.id,
          songs,
        });
        
        // Clear sessions cache
        if (user?.id) {
          localStorage.removeItem(`sr_sessions_${user.id}`);
        }
        
        router.push(`/ranking/${session.session_id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize ranking session");
      } finally {
        setIsCreatingSession(false);
      }
    },
    [user?.id, router]
  );

  return (
    <div className="h-full w-full relative">
      <AnimatePresence>
        {isCreatingSession && <LoadingOverlay />}
        {error && (
          <ErrorOverlay
            error={error}
            onDismiss={() => setError(null)}
            onRetry={() => {}} // Could trigger confirm again
          />
        )}
      </AnimatePresence>

      <ReviewView 
        onBack={() => router.push("/")}
        onConfirm={startRankingSession}
      />
    </div>
  );
}

function LoadingOverlay(): JSX.Element {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold font-mono uppercase tracking-tight">
          Initializing Session
        </h3>
        <p className="text-xs text-muted-foreground font-mono">
          Setting up your ranking environment…
        </p>
      </div>
    </div>
  );
}

type ErrorOverlayProps = Readonly<{
  error: string;
  onDismiss: () => void;
  onRetry: () => void;
}>;

function ErrorOverlay({
  error,
  onDismiss,
  onRetry,
}: ErrorOverlayProps): JSX.Element {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300 p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold font-mono uppercase tracking-tight text-destructive">
          Initialization Failed
        </h3>
        <p className="text-sm text-muted-foreground font-mono">{error}</p>
      </div>
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onDismiss}
          className="font-mono uppercase tracking-widest text-xs py-6 px-8"
        >
          Go Back
        </Button>
        <Button
          onClick={onRetry}
          className="bg-primary text-primary-foreground font-mono uppercase tracking-widest text-xs py-6 px-8"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
