"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { users } from "@/lib/data";
import { login as loginAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login: loginContext } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsLoggingIn(true);
    const result = await loginAction(selectedUserId);
    
    if (result.success) {
      loginContext(selectedUserId); // Update client-side context
      router.push("/dashboard");
      router.refresh(); // Refresh to ensure server-side data is up-to-date
    } else {
      toast({
        title: "Login Failed",
        description: result.error || "An unknown error occurred.",
        variant: "destructive"
      })
    }
    setIsLoggingIn(false);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Select your user profile to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="user-select">User Profile</Label>
            <Select onValueChange={setSelectedUserId} value={selectedUserId}>
              <SelectTrigger id="user-select" className="w-full">
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!selectedUserId || isLoggingIn}>
            {isLoggingIn ? "Signing In..." : <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </>}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
