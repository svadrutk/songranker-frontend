"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

import { AuthModal } from "@/components/AuthModal";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  openAuthModal: (mode?: "login" | "signup") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    // Get initial session
    console.log('[AuthProvider] Fetching initial session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthProvider] Initial session:', session ? `User ID: ${session.user.id}` : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[AuthProvider] Auth state changed (${_event}):`, session ? `User ID: ${session.user.id}` : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) setIsModalOpen(false); // Close modal on successful auth
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const openAuthModal = (mode: "login" | "signup" = "login") => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, openAuthModal }}>
      {children}
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialMode={modalMode} 
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
