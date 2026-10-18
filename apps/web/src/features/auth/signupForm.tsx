
import { useState } from "react";
import { Eye, EyeOff, Boxes } from "lucide-react";
import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        setError(error.message || "Something went wrong");
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soft-geometric-bg flex min-h-svh items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md gap-0 rounded-2xl border-white/70 bg-[#F8F6EB]/95 shadow-[0_12px_40px_rgba(91,65,145,0.12)] backdrop-blur-sm">
        <CardHeader className="space-y-3 px-6 pt-6 pb-4">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#A98BE8] to-[#7650D8] text-white shadow-md shadow-purple-300/40">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-[#30263F]">
                Stock<span className="text-[#8058D8]">Sphere</span>
              </p>
              <p className="text-xs text-[#81758F]">
                Inventory Management
              </p>
            </div>
          </div>

          <CardTitle className="text-2xl font-semibold tracking-tight text-[#30263F]">
            Create your account
          </CardTitle>

          <CardDescription className="text-[#777080]">
            Enter your details to get started with StockSphere
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pt-0 pb-6">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="border-[#DCD3EA] bg-white/80 focus-visible:ring-[#9270D8]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="border-[#DCD3EA] bg-white/80 focus-visible:ring-[#9270D8]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="border-[#DCD3EA] bg-white/80 pr-10 focus-visible:ring-[#9270D8]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#92869F] transition-colors hover:text-[#7650D8]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="border-[#DCD3EA] bg-white/80 pr-10 focus-visible:ring-[#9270D8]"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#92869F] transition-colors hover:text-[#7650D8]"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#7650D8] text-white shadow-sm transition-colors hover:bg-[#603CB9]"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[#777080]">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-[#7650D8] underline-offset-4 transition-colors hover:text-[#5936B4] hover:underline"
            >
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
