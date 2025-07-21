"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/data";
import { users } from "@/lib/data";

interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const COOKIE_NAME = "health_procure_user_id";

// Simplified function to get a cookie's value
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
        return match[2];
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
    // On initial load, check for the user ID from the cookie
    const userId = getCookie(COOKIE_NAME);
    if (userId) {
      const foundUser = users.find((u) => u.id === userId);
      setUser(foundUser || null);
    }
    setIsLoading(false);
  }, []);

  const login = (userId: string) => {
    const foundUser = users.find((u) => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      // Set cookie for 7 days, accessible by server. Path=/ makes it available across the site.
      document.cookie = `${COOKIE_NAME}=${userId}; max-age=${60*60*24*7}; path=/;`;
      router.push("/dashboard");
    }
  };

  const logout = () => {
    setUser(null);
    // Erase cookie by setting max-age to 0
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/;`;
    router.push("/");
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
