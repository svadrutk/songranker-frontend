"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-4 md:px-6 h-12 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2">
            <Image
              src="/logo/logo.svg"
              alt="Chorusboard Logo"
              width={36}
              height={36}
              className="h-7 w-7 md:h-9 md:w-9"
            />
          </div>
          <h1 className="font-mono text-xl md:text-2xl font-bold tracking-tighter lowercase">
            chorusboard
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Logged In As</span>
                <span className="text-xs font-mono font-medium">{user.email}</span>
              </div>
              <div className="h-8 w-[1px] bg-border mx-1 md:mx-2 hidden sm:block" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut()}
                className="font-mono text-[9px] md:text-[10px] uppercase font-bold tracking-widest hover:text-destructive px-2 md:px-3"
              >
                <LogOut className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Logout</span>
                <span className="xs:hidden">Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 md:gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => openAuthModal("login")}
                className="font-mono text-[9px] md:text-[10px] uppercase font-bold tracking-widest px-2 md:px-4"
              >
                Login
              </Button>
              <Button 
                size="sm" 
                onClick={() => openAuthModal("signup")}
                className="font-mono text-[9px] md:text-[10px] uppercase font-bold tracking-widest px-2 md:px-4"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
