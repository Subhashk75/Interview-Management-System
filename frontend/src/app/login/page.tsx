"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response: any = await apiClient.post("/auth/login", values);
      const { accessToken, user } = response.data;

      // Save user session in state & localStorage
      login(user, accessToken);

      // Check mandatory first-login password change flag
      if (user.requiresPasswordChange) {
        router.push("/change-password");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      const msg = err?.message || "Invalid credentials. Please verify your email and password.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (email: string, pass: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", pass, { shouldValidate: true });
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 text-white items-center justify-center font-bold text-2xl shadow-md mb-3">
            IMS
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Interview Management System
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise Single Sign-On & Account Access
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your corporate credentials to access your role dashboard.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  className={errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  {...register("password")}
                  className={errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-rose-500">{errors.password.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Sign In"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </CardFooter>
          </form>

          {/* Quick Demo Credentials Toolbar */}
          <div className="border-t px-6 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
            <span className="text-xs font-semibold text-slate-500 block mb-2 uppercase tracking-wider">
              Quick Autofill (Demo Accounts)
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setDemoCredentials("admin@ims.internal", "AdminPassword123!")}
              >
                Admin
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2 text-blue-600 border-blue-200"
                onClick={() => setDemoCredentials("hr@ims.internal", "TempPassword123!")}
              >
                HR (New User)
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setDemoCredentials("interviewer@ims.internal", "TempPassword123!")}
              >
                Interviewer
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setDemoCredentials("manager@ims.internal", "TempPassword123!")}
              >
                Hiring Mgr
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setDemoCredentials("candidate@ims.internal", "CandidatePassword123!")}
              >
                Candidate
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Tip: Accounts with temporary passwords will automatically guide you through the mandatory first-login password update.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
