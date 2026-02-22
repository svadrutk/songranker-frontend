import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-mono font-bold uppercase tracking-tight">Authentication Error</h1>
          <p className="text-sm text-muted-foreground font-mono">
            There was an issue completing your authentication. This can happen if the link has expired or has already been used.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full font-mono uppercase tracking-widest">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
