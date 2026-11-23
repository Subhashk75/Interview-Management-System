"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, UserRole } from "@/store/auth-store";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Edit2,
  Copy,
  Check,
  RefreshCw,
  ArrowUpDown,
  Building,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  LogOut,
  Home
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  department?: string;
  phoneNumber?: string;
  skills: string[];
  requiresPasswordChange: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  hrCount: number;
  interviewerCount: number;
  managerCount: number;
  candidateCount: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals state
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [provisionResult, setProvisionResult] = useState<{
    email: string;
    temporaryPassword: string;
    fullName: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Provision Form state
  const [formEmail, setFormEmail] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("ROLE_INTERVIEWER");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSkills, setFormSkills] = useState("");
  const [formCustomPassword, setFormCustomPassword] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Edit Form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const res: any = await apiClient.get("/users/metrics");
      if (res?.data) {
        setMetrics(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load user metrics", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        size: 10,
        sortBy: "createdAt",
        direction: "desc",
      };
      if (search.trim()) params.search = search.trim();
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus) params.status = selectedStatus;
      if (department.trim()) params.department = department.trim();

      const res: any = await apiClient.get("/users", { params });
      if (res?.data) {
        setUsers(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load user directory");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedRole, selectedStatus, department]);

  useEffect(() => {
    fetchUsers();
    fetchMetrics();
  }, [fetchUsers, fetchMetrics]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedRole("");
    setSelectedStatus("");
    setDepartment("");
    setPage(0);
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    const skillsArray = formSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const payload: any = {
        email: formEmail.trim(),
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        role: formRole,
        department: formDepartment.trim() || undefined,
        phoneNumber: formPhone.trim() || undefined,
        skills: skillsArray,
      };

      if (formCustomPassword.trim()) {
        payload.temporaryPassword = formCustomPassword.trim();
      }

      const res: any = await apiClient.post("/users", payload);
      const createdData = res?.data;

      setProvisionResult({
        email: createdData?.user?.email || formEmail,
        fullName: `${formFirstName} ${formLastName}`,
        role: formRole,
        temporaryPassword: createdData?.temporaryPassword || "Generated",
      });

      // Reset form fields
      setFormEmail("");
      setFormFirstName("");
      setFormLastName("");
      setFormDepartment("");
      setFormPhone("");
      setFormSkills("");
      setFormCustomPassword("");
      setSuccessMessage("User account provisioned successfully!");

      fetchUsers();
      fetchMetrics();
    } catch (err: any) {
      setError(err?.message || "Failed to provision user");
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setEditFirstName(u.firstName || "");
    setEditLastName(u.lastName || "");
    setEditDepartment(u.department || "");
    setEditPhone(u.phoneNumber || "");
    setEditSkills(u.skills ? u.skills.join(", ") : "");
    setIsEditOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    setError(null);

    const skillsArray = editSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await apiClient.put(`/users/${editingUser.id}`, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        department: editDepartment.trim() || undefined,
        phoneNumber: editPhone.trim() || undefined,
        skills: skillsArray,
      });

      setSuccessMessage(`User ${editingUser.email} profile updated successfully!`);
      setIsEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to update user profile");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (userToUpdate: UserItem) => {
    const nextStatus = userToUpdate.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setError(null);
    try {
      await apiClient.patch(`/users/${userToUpdate.id}/status`, {
        status: nextStatus,
      });
      setSuccessMessage(`Status updated to ${nextStatus} for ${userToUpdate.email}`);
      fetchUsers();
      fetchMetrics();
    } catch (err: any) {
      setError(err?.message || "Failed to update user status");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "ROLE_ADMIN":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0">Admin</Badge>;
      case "ROLE_HR":
        return <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">HR Recruiter</Badge>;
      case "ROLE_INTERVIEWER":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">Interviewer</Badge>;
      case "ROLE_HIRING_MANAGER":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-0">Hiring Manager</Badge>;
      case "ROLE_CANDIDATE":
        return <Badge className="bg-slate-600 hover:bg-slate-700 text-white border-0">Candidate</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Inactive
          </span>
        );
      case "LOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <Lock className="w-3 h-3 text-rose-500" />
            Locked
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-6 h-6" />
              <span>IMS Enterprise</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link
                href="/admin/users"
                className="text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-1"
              >
                Users & Roles
              </Link>
              <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                Dashboard Overview
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {currentUser.firstName} {currentUser.lastName}
                  </div>
                  <div className="text-xs text-slate-500">{currentUser.email}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              User Management & Profiles
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Provision internal accounts with temporary passwords, configure role profiles, and manage active status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setProvisionResult(null);
                setIsProvisionOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Provision New User
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-xs font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="shadow-none border border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Users</CardDescription>
              <CardTitle className="text-2xl font-bold">{metrics?.totalUsers ?? "--"}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-none border border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-emerald-600">Active</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {metrics?.activeUsers ?? "--"}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-none border border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-indigo-600">HR Recruiters</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                {metrics?.hrCount ?? "--"}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-none border border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-emerald-600">Interviewers</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {metrics?.interviewerCount ?? "--"}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-none border border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-amber-600">Managers</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {metrics?.managerCount ?? "--"}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-none border border-slate-200 dark:border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">Candidates</CardDescription>
              <CardTitle className="text-2xl font-bold">{metrics?.candidateCount ?? "--"}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="shadow-none border border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPage(0);
                }}
                className="h-10 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Roles</option>
                <option value="ROLE_ADMIN">Admin</option>
                <option value="ROLE_HR">HR Recruiter</option>
                <option value="ROLE_INTERVIEWER">Interviewer</option>
                <option value="ROLE_HIRING_MANAGER">Hiring Manager</option>
                <option value="ROLE_CANDIDATE">Candidate</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
                className="h-10 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOCKED">Locked</option>
              </select>

              <div className="flex gap-2">
                <Button type="submit" variant="secondary" className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-slate-100/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department & Phone</th>
                  <th className="py-3 px-4">Skills / Specializations</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                        <span>Loading user directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="font-medium">No users found matching current filters</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                            {u.firstName?.[0] || u.email[0].toUpperCase()}
                            {u.lastName?.[0] || ""}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{u.fullName || `${u.firstName} ${u.lastName}`}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                      {/* Department & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 dark:text-slate-100 font-medium">
                          {u.department || <span className="text-slate-400 italic">None</span>}
                        </div>
                        <div className="text-xs text-slate-500">{u.phoneNumber || "--"}</div>
                      </td>

                      {/* Skills */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.skills && u.skills.length > 0 ? (
                            u.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">None</span>
                          )}
                          {u.skills && u.skills.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 font-medium">
                              +{u.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(u.status)}
                          {u.requiresPasswordChange && (
                            <div className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Reset Required
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(u)}
                            className="h-8 px-2.5 text-xs flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant={u.status === "ACTIVE" ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            disabled={currentUser?.id === u.id}
                            title={currentUser?.id === u.id ? "Cannot deactivate yourself" : undefined}
                            className={`h-8 px-2.5 text-xs flex items-center gap-1 ${
                              u.status === "ACTIVE"
                                ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {u.status === "ACTIVE" ? (
                              <>
                                <Lock className="w-3 h-3" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {users.length} of {totalElements} users
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Page {page + 1} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Provision User Modal */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Provision New Account</h3>
              </div>
              <button
                onClick={() => {
                  setIsProvisionOpen(false);
                  setProvisionResult(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {provisionResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Account Provisioned Successfully!
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    An initial temporary password has been generated for <strong>{provisionResult.fullName}</strong> (
                    {provisionResult.email}). The user will be required to change it immediately upon their first login.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Temporary Credentials
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {provisionResult.temporaryPassword}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(provisionResult.temporaryPassword)}
                      className="flex items-center gap-1 text-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => {
                      setIsProvisionOpen(false);
                      setProvisionResult(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProvisionUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
                    <Input
                      required
                      placeholder="e.g. Sarah"
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name *</label>
                    <Input
                      required
                      placeholder="e.g. Jenkins"
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Work Email *</label>
                  <Input
                    type="email"
                    required
                    placeholder="sarah.jenkins@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Role *</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as UserRole)}
                      className="mt-1 w-full h-10 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ROLE_INTERVIEWER">Interviewer</option>
                      <option value="ROLE_HR">HR Recruiter</option>
                      <option value="ROLE_HIRING_MANAGER">Hiring Manager</option>
                      <option value="ROLE_ADMIN">Administrator</option>
                      <option value="ROLE_CANDIDATE">Candidate</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
                    <Input
                      placeholder="e.g. Engineering"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                    <Input
                      placeholder="+1-555-0199"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Temporary Password (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={formCustomPassword}
                      onChange={(e) => setFormCustomPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Skills / Interview Topics (Comma separated)
                  </label>
                  <Input
                    placeholder="Java, System Design, Microservices"
                    value={formSkills}
                    onChange={(e) => setFormSkills(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used by HR when matching interviewers to interview rounds.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProvisionOpen(false)}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {formSubmitting ? "Provisioning..." : "Provision Account"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit User Profile</h3>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="text-xs text-slate-500">
                Editing: <strong className="text-slate-800 dark:text-slate-200">{editingUser.email}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
                  <Input
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name *</label>
                  <Input
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
                  <Input
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Skills / Interview Topics (Comma separated)
                </label>
                <Input
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
