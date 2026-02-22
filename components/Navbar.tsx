"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, Send } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useFeedback } from "./FeedbackProvider";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/lib/store";
import { motion } from "framer-motion";

export function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();
  const { openFeedback } = useFeedback();
  const { view, navigateToCreate, navigateToAnalytics, navigateToMyRankings, setSidebarCollapsed } = useNavigationStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleLogoClick = () => {
    navigateToCreate();
    setSidebarCollapsed(true);
  };

  const navItems = [
    { label: "Create", viewId: "create", onClick: () => navigateToCreate() },
    { label: "My Rankings", viewId: "my_rankings", onClick: () => navigateToMyRankings(false) },
    { label: "Stats", viewId: "analytics", onClick: () => navigateToAnalytics() },
  ];

  const logoSrc = mounted && resolvedTheme === "dark" ? "/logo/logo.svg" : "/logo/logo-dark.svg";

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur-md sticky top-0 z-[60]">
      <div className="w-full px-4 md:px-8 h-16 md:h-20 flex items-center justify-between relative">
        <div className="flex items-center shrink-0">
          <motion.button
            type="button"
            onClick={handleLogoClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src={logoSrc}
              alt="Chorusboard Logo"
              width={36}
              height={36}
              className="h-9 w-9 md:h-12 md:w-12"
            />
            <h1 className="font-mono text-xl md:text-3xl font-bold tracking-tighter lowercase shrink-0">
              chorusboard
            </h1>
          </motion.button>
        </div>

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-muted/30 p-1.5 rounded-full border border-border/50">
          {navItems.map((item) => (
            <motion.button
              key={item.viewId}
              onClick={item.onClick}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              className={cn(
                "px-5 py-2 rounded-full font-mono text-[10px] lg:text-xs uppercase font-black tracking-[0.2em] transition-all duration-300 relative",
                view === item.viewId ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {view === item.viewId && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-primary/10 rounded-full border border-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {item.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={openFeedback}
            className="font-mono text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground hover:text-primary gap-2 h-9 md:h-10 px-3 md:px-5 rounded-full transition-all"
          >
            <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </Button>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden lg:block font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => signOut()}
                className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                aria-label="Logout"
              >
                <LogOut className="h-4.5 w-4.5 md:h-5 md:w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 md:gap-3">
              <Button 
                variant="ghost" 
                onClick={() => openAuthModal("login")}
                className="font-mono text-[10px] md:text-sm uppercase font-bold tracking-widest px-3 md:px-6 h-9 md:h-10 rounded-full"
              >
                Login
              </Button>
              <Button 
                onClick={() => openAuthModal("signup")}
                className="font-mono text-[10px] md:text-sm uppercase font-bold tracking-widest px-4 md:px-7 h-9 md:h-10 rounded-full shadow-lg shadow-primary/10"
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
