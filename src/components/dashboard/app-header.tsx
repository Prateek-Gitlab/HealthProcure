"use client";

import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, HeartPulse } from "lucide-react";

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-lg backdrop-blur-md shadow-custom-sm">
      <div className="flex items-center gap-md">
        <div className="bg-gradient-primary text-primary-foreground p-2 rounded-custom shadow-custom">
            <HeartPulse className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-semibold font-headline text-gradient">HealthProcure</h1>
      </div>
      
      <div className="flex items-center gap-sm">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                className="flex items-center gap-md h-auto px-md py-2 rounded-custom shadow-custom-sm hover:shadow-custom transition-all duration-200"
              >
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role} Level
                  </p>
                </div>
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-custom-lg animate-scale-in">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">{user.role} Level</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive/90 transition-colors duration-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
