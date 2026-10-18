
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "../features/auth/loginForm";

export function LoginPage() {
  return (
    <div className="soft-geometric-bg flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm rounded-2xl border-white/70 bg-[#F8F6EB]/95 shadow-[0_12px_40px_rgba(91,65,145,0.12)] backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#A98BE8] to-[#7650D8] text-white shadow-md shadow-purple-300/40">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M12 2.8 20 7.3v9.4l-8 4.5-8-4.5V7.3l8-4.5Z" />
                <path d="m4.5 7.6 7.5 4.3 7.5-4.3M12 12v9M8 5l8 4.5v4.2l-4 2.3-4-2.3V9.5" />
              </svg>
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
            Welcome back
          </CardTitle>

          <CardDescription className="text-[#777080]">
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LoginForm />

          <p className="mt-6 text-center text-sm text-[#777080]">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="font-semibold text-[#7650D8] underline-offset-4 transition-colors hover:text-[#5936B4] hover:underline"
            >
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
