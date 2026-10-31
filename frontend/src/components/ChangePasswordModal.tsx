import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ChangePasswordModalProps {
  isOpen: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen }) => {
  const { user, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpperLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && isMatch && currentPassword.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please satisfy all password criteria before proceeding.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to change password. Please verify your temporary password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Mandatory Password Update</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Welcome, {user?.firstName || 'Staff Member'}! Your account was initialized with a temporary password.
              </p>
            </div>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="px-6 pt-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-amber-200/90">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">First-Time Login Security Policy</p>
              <p className="text-[11px] text-amber-200/70 mt-0.5">
                To protect organizational data, you must establish a permanent password before accessing the candidate pipeline and interview tools.
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-6 pt-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="px-6 pt-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password updated successfully! Unlocking your dashboard...</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Current Temporary Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password provided by admin"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              New Permanent Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong new password"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Validation Checklist */}
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 space-y-1.5 text-[11px]">
            <p className="font-semibold text-slate-300 text-xs mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Password Security Requirements
            </p>
            <div className="flex items-center space-x-2 text-slate-400">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {hasMinLength ? '✓' : '•'}
              </div>
              <span className={hasMinLength ? 'text-emerald-400' : ''}>At least 8 characters</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${hasUpperLower ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {hasUpperLower ? '✓' : '•'}
              </div>
              <span className={hasUpperLower ? 'text-emerald-400' : ''}>Uppercase and lowercase letters</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {hasNumber ? '✓' : '•'}
              </div>
              <span className={hasNumber ? 'text-emerald-400' : ''}>At least one number</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${isMatch ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {isMatch ? '✓' : '•'}
              </div>
              <span className={isMatch ? 'text-emerald-400' : ''}>Passwords match</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={logout}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition px-2 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'Updating Password...' : 'Save & Enter Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
