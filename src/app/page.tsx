import { LoginForm } from "@/components/auth/login-form";
import { Syringe } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary text-primary-foreground p-3 rounded-full mb-4">
            <Syringe className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-center font-headline">
            HealthProcure
          </h1>
          <p className="text-muted-foreground text-center mt-1">
            Sign in to manage procurement requests.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
