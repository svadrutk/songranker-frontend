"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // The Supabase client automatically handles the code exchange 
      // when it initialized, but we can also be explicit or just 
      // wait for the session to be established.
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error during auth callback:", error.message);
        router.push("/?error=auth");
      } else {
        router.push("/");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-mono text-muted-foreground animate-pulse">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}
