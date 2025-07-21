"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/data";
import { users } from "@/lib/data";
import { logout as logoutAction } from "@/lib/actions";

interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const COOKIE_NAME = "health_procure_user_id";

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userId = getCookie(COOKIE_NAME);
    if (userId) {
      const foundUser = users.find((u) => u.id === userId);
      setUser(foundUser || null);
    }
    setIsLoading(false);
  }, []);

  // This login function is now only for updating the client-side state
  const login = (userId: string) => {
    const foundUser = users.find((u) => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
    }
  };

  const logout = async () => {
    setUser(null);
    await logoutAction();
    router.push("/");
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
