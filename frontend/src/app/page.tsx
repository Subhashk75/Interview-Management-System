"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CalendarCheck,
  FileCheck2,
  Users2,
  Briefcase,
  ArrowRight,
  Server,
  Activity,
  CheckCircle2,
  Lock,
  LogOut,
  User as UserIcon,
} from "lucide-react";

interface HealthData {
  status: string;
  service: string;
  version: string;
  javaVersion: string;
  timestamp: string;
}

export default function HomePage() {
  const { user, isAuthenticated, logout, initializeSession } = useAuthStore();

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const { data: healthResponse, isLoading } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      return apiClient.get<any, { success: boolean; data: HealthData }>("/health");
    },
    refetchInterval: 30000,
  });

  const backendHealthy = healthResponse?.data?.status === "UP";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              IMS
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Interview Management System
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Sprint 3 Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Backend Connection Indicator */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <Server className="w-4 h-4 text-slate-500" />
              <span>Backend:</span>
              {isLoading ? (
                <Badge variant="outline" className="animate-pulse">
                  Connecting...
                </Badge>
              ) : backendHealthy ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Spring Boot 3 (UP)
                </Badge>
              ) : (
                <Badge variant="warning" className="flex items-center gap-1">
                  Offline / Standalone
                </Badge>
              )}
            </div>

            {/* Auth Session State */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {user.requiresPasswordChange && (
                  <Link href="/change-password">
                    <Badge variant="warning" className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-xs">
                      <Lock className="w-3 h-3" />
                      Password Change Required
                    </Badge>
                  </Link>
                )}

                <div className="hidden md:flex items-center gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block leading-tight">{user.fullName || user.email}</span>
                    <span className="text-slate-400 text-[10px] uppercase font-mono">{user.role.replace("ROLE_", "")}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-xs h-8">
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="info" className="mb-4 py-1 px-3 text-xs uppercase tracking-wider">
            Sprint 3: User Management & Role Profiles
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Centralized Recruitment & Interview Lifecycle Management
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Engineered with Java 21, Spring Boot 3.x, Spring Data MongoDB, and Next.js App Router.
            Stateless JWT authentication, forced first-login password resets, and granular user role lifecycle management.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!isAuthenticated ? (
              <Link href="/login">
                <Button size="lg" className="shadow-md">
                  Sign In to Your Workspace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Authenticated as <strong className="font-bold">{user?.email}</strong> ({user?.role})
                </div>
                {user?.role === "ROLE_ADMIN" && (
                  <Link href="/admin/users">
                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                      Open Users & Roles Portal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 5 Role-Specific Dashboards */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Role-Tailored Workspaces
              </h2>
              <p className="text-sm text-slate-500">
                Each organizational persona accesses a purpose-built workspace with strict backend RBAC.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Admin */}
            <Link href="/admin/users" className="block">
              <Card className="hover:shadow-md transition-shadow h-full cursor-pointer hover:border-indigo-300">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Administrator</CardTitle>
                    <Badge variant="outline" className="text-xs">ROLE_ADMIN</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Account provisioning with temporary passwords, forced first-login reset, user lifecycle management, and audit logs.
                  </p>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                    <span>Manage Users & Roles</span>
                    <ArrowRight className="w-3 h-3 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* HR / Recruiter */}
            <Card className="hover:shadow-md transition-shadow border-blue-200 dark:border-blue-900/50">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">HR Recruiter</CardTitle>
                  <Badge variant="default" className="text-xs">ROLE_HR</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Candidate profile ingestion, PDF resume drawer, 12-stage pipeline Kanban, and atomic multi-interviewer scheduling.
                </p>
                <div className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                  <span>Target: /hr</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Interviewer */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Interviewer</CardTitle>
                  <Badge variant="outline" className="text-xs">ROLE_INTERVIEWER</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Personal interview calendar, availability slot manager, candidate resume access, and blind scorecard submissions.
                </p>
                <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <span>Target: /interviewer</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
                </div>
              </CardContent>
            </Card>

            {/* Hiring Manager */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Hiring Manager</CardTitle>
                  <Badge variant="outline" className="text-xs">ROLE_HIRING_MANAGER</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Requisition oversight, candidate consensus debriefs, stage progression approvals, and interviewer fatigue analytics.
                </p>
                <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <span>Target: /hiring-manager</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
                </div>
              </CardContent>
            </Card>

            {/* Candidate Portal */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Candidate Portal</CardTitle>
                  <Badge variant="outline" className="text-xs">ROLE_CANDIDATE</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Interview invitation review, localized timezone conversion, meeting links, instructions, and reschedule requests.
                </p>
                <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <span>Target: /candidate</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
                </div>
              </CardContent>
            </Card>

            {/* System Architecture */}
            <Card className="hover:shadow-md transition-shadow bg-slate-100 dark:bg-slate-900/60 border-dashed">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">API Documentation</CardTitle>
                  <Badge variant="secondary" className="text-xs">OpenAPI 3.0</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Explore complete Swagger/OpenAPI interactive documentation, database schemas, and research docs.
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <span>Swagger: /swagger-ui.html</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sprint 2 Completed Security Features */}
        <div className="border rounded-xl p-8 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Sprint 2 Authentication & Security Milestones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Stateless JWT Authentication
                </span>
                <span className="text-slate-500 text-xs">
                  HMAC-SHA256 signed access and refresh token pair with 1-hour/7-day rotation.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  BCrypt Password Hashing
                </span>
                <span className="text-slate-500 text-xs">
                  Work factor 12 cryptographic hashing with salt generation.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Mandatory First-Login Password Policy
                </span>
                <span className="text-slate-500 text-xs">
                  Backend interceptor blocks non-auth endpoints when requiresPasswordChange is true.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Next.js Login & Change Password Pages
                </span>
                <span className="text-slate-500 text-xs">
                  React Hook Form with Zod validation and one-click demo credentials autofill.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Automated Database Seeder
                </span>
                <span className="text-slate-500 text-xs">
                  CommandLineRunner bootstrapping Admin, HR, Interviewer, Manager, and Candidate accounts.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Zustand Auth Store & Axios Interceptor
                </span>
                <span className="text-slate-500 text-xs">
                  Persistent local storage sync and automatic Bearer header attachment on all requests.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-white dark:bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Enterprise Interview Management System (IMS) • Sprint 2 Milestone</span>
          <span>Java 21 • Spring Boot 3.3.5 • MongoDB 7.0 • Next.js 14</span>
        </div>
      </footer>
    </div>
  );
}
