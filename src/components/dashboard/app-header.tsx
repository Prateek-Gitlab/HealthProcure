"use client";

import { useAuth } from "@/contexts/auth-context";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppHeader() {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden"/>
        <h1 className="text-xl font-semibold hidden md:block">Dashboard</h1>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {user.role} Level
            </p>
          </div>
          <Avatar>
            <AvatarImage src={`https://placehold.co/40x40.png`} alt={user.name} data-ai-hint="profile avatar" />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </div>
      )}
    </header>
  );
}
