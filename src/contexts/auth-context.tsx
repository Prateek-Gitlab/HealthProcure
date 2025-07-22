
"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/data";
import { getAllUsers } from "@/lib/data";
import { logout as logoutAction } from "@/lib/actions";

interface AuthContextType {
  user: User | null;
  login: (userId: string, users: User[]) => void;
  logout: () => void;
  isLoading: boolean;
  allUsers: User[];
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsersAndAuth = async () => {
        try {
            const users = await getAllUsers();
            setAllUsers(users);
            const userId = getCookie(COOKIE_NAME);
            if (userId) {
              const foundUser = users.find((u) => u.id === userId);
              setUser(foundUser || null);
            }
        } catch (e) {
            console.error("Failed to fetch users", e)
        } finally {
            setIsLoading(false);
        }
    }
    fetchUsersAndAuth();
  }, []);

  const login = (userId: string, users: User[]) => {
    const foundUser = users.find((u) => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
    }
  };

  const logout = () => {
    setUser(null);
    logoutAction(); // Don't await this
    router.push("/");
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, allUsers }}>
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
