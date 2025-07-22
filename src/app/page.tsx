"use client";

import { LoginForm } from "@/components/auth/login-form";
import { getAllUsers } from '@/lib/data';
import { HeartPulse } from "lucide-react";
import { useState, useEffect } from "react";
import { type User } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then(fetchedUsers => {
      setUsers(fetchedUsers);
      setIsLoading(false);
    });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary text-primary-foreground p-3 rounded-full mb-4">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-center font-headline">
            HealthProcure
          </h1>
          <p className="text-muted-foreground text-center mt-1">
            Sign in to manage procurement requests.
          </p>
        </div>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : (
            <LoginForm users={users} />
        )}
      </div>
    </main>
  );
}
