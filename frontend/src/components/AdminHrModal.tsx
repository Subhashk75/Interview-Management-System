import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Shield, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight, Mail, Key } from 'lucide-react';
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

  // New HR creation state
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [title, setTitle] = useState('Senior Technical Recruiter');
  const [department, setDepartment] = useState('Talent Acquisition');
  const [role, setRole] = useState<UserRole>('RECRUITER');
  const [creating, setCreating] = useState(false);

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

  const handleCreateHr = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/auth/admin/hr', {
        firstName,
        lastName,
        email,
        password,
        role,
        title,
        department,
      });

      setSuccess(`HR account created for ${firstName} ${lastName}`);
      setShowAddForm(false);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create HR account');
    } finally {
      setCreating(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">HR & Team Access Management</h2>
              <p className="text-xs text-slate-400">Admin control panel for recruiters and panelists</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showAddForm ? 'View User Roster' : 'Add HR / Recruiter'}
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

          {/* Add HR Form */}
          {showAddForm ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" /> Create New HR / Recruiter Account
                </h3>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Auto-Verified by Admin
                </span>
              </div>

              <form onSubmit={handleCreateHr} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@company.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password123!"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Technical Recruiter"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Talent Acquisition"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">System Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="RECRUITER">RECRUITER (HR Staff)</option>
                      <option value="ADMIN">ADMIN (Full Control)</option>
                      <option value="INTERVIEWER">INTERVIEWER (Panelist)</option>
                    </select>
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
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow disabled:opacity-50"
                  >
                    {creating ? 'Saving...' : 'Create HR Account'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Users Table */
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-800/60 px-4 py-2.5 text-xs font-bold text-slate-300 border-b border-slate-800 flex items-center justify-between">
                <span>Team Members & HR Staff ({users.length})</span>
                <span className="text-[11px] text-slate-400 font-normal">Manage roles & access permissions</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto custom-scrollbar">
                {users.map((u) => (
                  <div key={u._id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/30 transition">
                    <div className="flex items-center space-x-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.firstName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-white">
                            {u.firstName} {u.lastName}
                          </p>
                          {u.isVerified && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-semibold">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                        <p className="text-[10px] text-slate-500">
                          {u.title || 'Team Member'} • {u.department || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Role selector */}
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none transition ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : u.role === 'RECRUITER'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        <option value="RECRUITER" className="bg-slate-900 text-white">RECRUITER (HR)</option>
                        <option value="ADMIN" className="bg-slate-900 text-white">ADMIN</option>
                        <option value="INTERVIEWER" className="bg-slate-900 text-white">INTERVIEWER</option>
                      </select>

                      {/* Active toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u._id)}
                        title={`Click to ${u.isActive !== false ? 'Deactivate' : 'Activate'}`}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1 ${
                          u.isActive !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
