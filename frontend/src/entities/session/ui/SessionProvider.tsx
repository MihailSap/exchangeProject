"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../model/session";
import { clearSession, readSession, writeSession } from "../model/session";

type SessionContextValue = {
  user: AuthUser | null;
  ready: boolean;
  setUser: (user: AuthUser | null) => void;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUserState(readSession()?.user ?? null);
    setReady(true);
  }, []);

  const setUser = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser);
    const session = readSession();
    if (session && nextUser) writeSession({ ...session, user: nextUser });
    if (!nextUser) clearSession();
  }, []);

  const signOut = useCallback(async () => {
    const session = readSession();
    if (session) {
      try {
        const { apiRequest } = await import("@/src/shared/api/client");
        try {
          await apiRequest<void>("/users/me", { authenticated: true });
        } catch {
          if (!readSession()) return;
        }
        const activeSession = readSession();
        if (!activeSession) return;
        await apiRequest<void>("/auth/logout", {
          method: "POST",
          body: { refreshToken: activeSession.refreshToken },
          authenticated: true,
        });
      } finally {
        clearSession();
        setUserState(null);
      }
    } else {
      clearSession();
      setUserState(null);
    }
  }, []);

  const value = useMemo(() => ({ user, ready, setUser, signOut }), [user, ready, setUser, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
