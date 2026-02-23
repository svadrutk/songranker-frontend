"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, Send, Menu, X } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useFeedback } from "./FeedbackProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();
  const { openFeedback } = useFeedback();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [pathname]);

  const isRankingPage = pathname?.startsWith("/ranking/");

  const navItems = [
    { label: "Create", href: "/" },
    { label: "My Rankings", href: "/my-rankings", protected: true },
    { label: "Stats", href: "/analytics" },
  ];

  if (isRankingPage) {
    navItems.push({ label: "Ranking", href: pathname });
  }

  const handleNavItemClick = (e: React.MouseEvent, item: { label: string, href: string, protected?: boolean }) => {
    if (item.protected && !user) {
      e.preventDefault();
      openAuthModal("login");
    }
  };

  const logoSrc = mounted && resolvedTheme === "dark" ? "/logo/logo.svg" : "/logo/logo-dark.svg";

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur-md sticky top-0 z-[100]">
      <div className="w-full px-4 md:px-8 h-16 md:h-20 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center relative">
        {/* Left: Logo */}
        <div className="flex items-center justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
          >
            <div className="relative">
              <Image
                src={logoSrc}
                alt="Chorusboard Logo"
                width={36}
                height={36}
                className="h-8 w-8 md:h-10 md:w-10 relative z-10"
              />
            </div>
            <h1 className="font-mono text-lg md:text-2xl font-bold tracking-tighter lowercase shrink-0">
              chorusboard
            </h1>
          </Link>
        </div>

        {/* Center: Desktop Nav */}
        <div className="hidden md:flex items-center justify-center relative z-50">
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-full border border-border/50">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavItemClick(e, item)}
                className={cn(
                  "px-4 py-1.5 rounded-full font-mono text-[10px] lg:text-xs uppercase font-black tracking-[0.2em] transition-all duration-300 relative cursor-pointer outline-none",
                  pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {pathname === item.href && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-primary/10 rounded-full border border-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.1)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={openFeedback}
            className="hidden sm:flex font-mono text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground hover:text-primary gap-2 h-9 md:h-10 px-3 md:px-5 rounded-full transition-all"
          >
            <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span>Feedback</span>
          </Button>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden lg:block font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => signOut()}
                className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 md:gap-2">
              <Button 
                variant="ghost" 
                onClick={() => openAuthModal("login")}
                className="font-mono text-[10px] md:text-xs uppercase font-bold tracking-widest px-2 md:px-4 h-8 md:h-10 rounded-full"
              >
                Login
              </Button>
              <Button 
                onClick={() => openAuthModal("signup")}
                className="font-mono text-[10px] md:text-xs uppercase font-bold tracking-widest px-3 md:px-5 h-8 md:h-10 rounded-full shadow-lg shadow-primary/10"
              >
                Join
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground z-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t bg-background overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    handleNavItemClick(e, item);
                    if (!item.protected || user) setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "px-4 py-3 rounded-xl font-mono text-sm uppercase font-black tracking-[0.1em] transition-all text-left block",
                    pathname === item.href 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={openFeedback}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm uppercase font-black tracking-[0.1em] text-muted-foreground hover:bg-muted w-full text-left transition-all"
              >
                <Send className="h-4 w-4" />
                Feedback
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
