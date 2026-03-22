"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

interface SessionUser {
  userId: string;
  name: string;
  image: string;
  steamId: string;
  role: string;
}

interface SessionContextType {
  user: SessionUser | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: SessionUser | null;
}) {
  return (
    <SessionContext.Provider value={{ user: session, loading: false }}>
      {children}
    </SessionContext.Provider>
  );
}
