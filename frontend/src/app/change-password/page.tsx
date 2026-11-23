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
import { ShieldAlert, Lock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, setPasswordChanged, logout } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await apiClient.post("/auth/change-password", values);
      setPasswordChanged();
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update password. Please check your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Security Warning Banner */}
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <span className="font-bold block text-sm text-amber-950 dark:text-amber-100">
              Mandatory First-Login Password Change
            </span>
            <p>
              Your account was provisioned with a temporary onboarding password.
              In accordance with enterprise security policy, you must set a permanent private password before accessing your workspace.
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl">Set New Permanent Password</CardTitle>
            <CardDescription>
              {user ? `Account: ${user.email} (${user.role.replace("ROLE_", "")})` : "Enter your new credentials below"}
            </CardDescription>
          </CardHeader>

          {isSuccess ? (
            <CardContent className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Password Successfully Updated
              </h3>
              <p className="text-xs text-slate-500">
                Security flag cleared. Redirecting you to your dashboard...
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Current (Temporary) Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    {...register("currentPassword")}
                    className={errors.currentPassword ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                  />
                  {errors.currentPassword && (
                    <p className="text-xs text-rose-500">{errors.currentPassword.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    New Permanent Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    {...register("newPassword")}
                    className={errors.newPassword ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-rose-500">{errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Password Policy Checklist */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border text-[11px] text-slate-500 space-y-1">
                  <span className="font-semibold block text-slate-700 dark:text-slate-300">
                    Password Requirements:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    At least 8 characters in length
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Must differ from previous temporary password
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                >
                  Cancel & Sign Out
                </Button>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password & Continue"}
                  {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
