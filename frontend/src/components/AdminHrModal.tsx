import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Key,
  RotateCcw,
  Copy,
  Check,
  Search,
  Lock,
  UserCheck,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import api from '../services/api.ts';
import { User, UserRole } from '../types/index.ts';

interface AdminHrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminHrModal: React.FC<AdminHrModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'HR' | 'INTERVIEWER' | 'MANAGER' | 'CANDIDATE'>('ALL');

  // New Staff Creation state
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('HR');
  const [creating, setCreating] = useState(false);

  // Created/Reset Credential Banner
  const [newCredentials, setNewCredentials] = useState<{
    email: string;
    temporaryPassword: string;
    name: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Password reset state
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadUsers();
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/auth/admin/users');
      setUsers(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load organization users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);
    setNewCredentials(null);

    try {
      const res: any = await api.post('/auth/admin/staff', {
        firstName,
        lastName,
        email,
        temporaryPassword: customPassword.trim() || undefined,
        role,
        title: title || (role === 'HR' ? 'Talent Acquisition Partner' : role === 'MANAGER' ? 'Engineering Hiring Manager' : 'Technical Interviewer'),
        department: department || 'Engineering',
      });

      const tempPass = res.data?.temporaryPassword || customPassword || 'TempPass123!';
      setNewCredentials({
        email,
        temporaryPassword: tempPass,
        name: `${firstName} ${lastName}`,
        role,
      });

      setSuccess(`Staff account created for ${firstName} ${lastName} with mandatory first login password change.`);
      setShowAddForm(false);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setCustomPassword('');
      setTitle('');
      setDepartment('');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create staff account');
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    const confirmReset = window.confirm(
      `Are you sure you want to reset the password for ${user.firstName} ${user.lastName} (${user.email})? A temporary password will be generated and they will be required to change it upon next login.`
    );
    if (!confirmReset) return;

    setResettingId(user._id);
    setError(null);
    setSuccess(null);
    setNewCredentials(null);

    try {
      const res: any = await api.post(`/auth/admin/users/${user._id}/reset-password`);
      const tempPass = res.data?.temporaryPassword;
      setNewCredentials({
        email: user.email,
        temporaryPassword: tempPass,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      });
      setSuccess(`Password successfully reset for ${user.firstName} ${user.lastName}. Temporary credentials ready.`);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/auth/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole as UserRole } : u)));
      setSuccess('User role updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update user role');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res: any = await api.patch(`/auth/admin/users/${userId}/status`);
      const updatedActive = res.data?.isActive;
      setUsers(users.map((u) => (u._id === userId ? { ...u, isActive: updatedActive } : u)));
      setSuccess(`User status updated to ${updatedActive ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to toggle status');
    }
  };

  const copyCredentials = () => {
    if (!newCredentials) return;
    const text = `Interview Management System Account:\nEmail: ${newCredentials.email}\nTemporary Password: ${newCredentials.temporaryPassword}\nNote: You will be prompted to set a permanent password upon first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedRoleFilter === 'ALL') return true;
    if (selectedRoleFilter === 'HR') return u.role === 'HR' || u.role === 'RECRUITER';
    if (selectedRoleFilter === 'MANAGER') return u.role === 'MANAGER' || u.role === 'HIRING_MANAGER';
    if (selectedRoleFilter === 'INTERVIEWER') return u.role === 'INTERVIEWER';
    if (selectedRoleFilter === 'CANDIDATE') return u.role === 'CANDIDATE';

    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Admin Staff & Account Governance</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Centralized Provisioning
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Provision HR, Interviewers, and Hiring Managers with mandatory first login password security
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setNewCredentials(null);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showAddForm ? 'View User Roster' : 'Create Staff Account'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* New Credentials Banner with Copy Button */}
          {newCredentials && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Temporary Staff Credentials Generated for {newCredentials.name}</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
                  Password Change Mandatory on 1st Login
                </span>
              </div>
              <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-400">Login Email: </span>
                    <span className="text-white font-mono font-bold">{newCredentials.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Temporary Password: </span>
                    <span className="text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {newCredentials.temporaryPassword}
                    </span>
                  </div>
                </div>
                <button
                  onClick={copyCredentials}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-medium transition flex items-center gap-1.5 self-start sm:self-center shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>Copy Credentials</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-amber-200/70">
                Provide these credentials to the user. Upon first sign-in, the system will block all dashboard and interview access until a secure permanent password is set.
              </p>
            </div>
          )}

          {/* Add Staff Form */}
          {showAddForm ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" /> Provision Staff Account (HR, Interviewer, Manager)
                </h3>
                <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Mandatory Password Change Flag Active
                </span>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Rachel"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Green"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rachel.green@company.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Temporary Password (Optional — auto-generated if blank)
                    </label>
                    <input
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Leave blank for auto-generated temporary password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="HR">HR / Recruiter (Full Pipeline Management)</option>
                      <option value="INTERVIEWER">INTERVIEWER (Panelist & Scorecards)</option>
                      <option value="MANAGER">MANAGER (Hiring Manager Reviews)</option>
                      <option value="ADMIN">ADMIN (Full Governance)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={role === 'HR' ? 'Talent Acquisition Partner' : role === 'MANAGER' ? 'Engineering Director' : 'Principal Architect'}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Engineering / Product / Operations"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Security Guarantee: </span>
                    Accounts provisioned via this Admin Console are auto-verified by the organization. The user will be forced to change this temporary password upon first login prior to gaining access to confidential applicant data.
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow disabled:opacity-50 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {creating ? 'Provisioning Account...' : 'Provision Staff Account'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Users Roster Section */
            <div className="space-y-3">
              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 w-full sm:w-auto overflow-x-auto">
                  {(['ALL', 'HR', 'INTERVIEWER', 'MANAGER', 'CANDIDATE'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRoleFilter(r)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                        selectedRoleFilter === r
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {r === 'ALL' ? 'All Accounts' : r}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Roster Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                <div className="bg-slate-800/60 px-4 py-2.5 text-xs font-bold text-slate-300 border-b border-slate-800 flex items-center justify-between">
                  <span>Accounts Roster ({filteredUsers.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Real-time status, role assignments & password security lifecycle
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto custom-scrollbar">
                  {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading user roster...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No accounts found matching your filter criteria.
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isPendingPasswordChange = Boolean(u.mustChangePassword);
                      return (
                        <div
                          key={u._id}
                          className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 transition"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={u.firstName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-xs font-bold text-white">
                                  {u.firstName} {u.lastName}
                                </p>
                                {u.isVerified && (
                                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/20">
                                    Verified
                                  </span>
                                )}
                                {isPendingPasswordChange ? (
                                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold border border-amber-500/20 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5 text-amber-400" /> 1st Login Change Pending
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                                    Password Set
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                              <p className="text-[10px] text-slate-500">
                                {u.title || 'Staff Member'} • {u.department || 'Operations'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2.5 self-end md:self-center">
                            {/* Role selector */}
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none transition ${
                                u.role === 'ADMIN'
                                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                  : u.role === 'HR' || u.role === 'RECRUITER'
                                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                  : u.role === 'MANAGER' || u.role === 'HIRING_MANAGER'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : u.role === 'INTERVIEWER'
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              <option value="HR" className="bg-slate-900 text-white">HR (Recruiter)</option>
                              <option value="INTERVIEWER" className="bg-slate-900 text-white">INTERVIEWER</option>
                              <option value="MANAGER" className="bg-slate-900 text-white">MANAGER (Hiring)</option>
                              <option value="ADMIN" className="bg-slate-900 text-white">ADMIN</option>
                              <option value="CANDIDATE" className="bg-slate-900 text-white">CANDIDATE</option>
                            </select>

                            {/* Active toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u._id)}
                              title={`Click to ${u.isActive !== false ? 'Deactivate' : 'Activate'}`}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                                u.isActive !== false
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {u.isActive !== false ? 'Active' : 'Inactive'}
                            </button>

                            {/* Reset Password Action */}
                            <button
                              type="button"
                              disabled={resettingId === u._id}
                              onClick={() => handleResetPassword(u)}
                              title="Reset password with mandatory temporary password"
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 hover:border-amber-500/40 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                            >
                              <RotateCcw className={`w-3 h-3 ${resettingId === u._id ? 'animate-spin' : ''}`} />
                              <span>Reset Password</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminStaffManagementModal = AdminHrModal;
