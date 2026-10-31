import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserCheck, Shield, LogIn, LogOut, UserPlus, Users } from 'lucide-react';
import { AuthModal } from './AuthModal.tsx';
import { AdminHrModal } from './AdminHrModal.tsx';

interface NavbarProps {
  onNavigateTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateTab }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [adminHrModalOpen, setAdminHrModalOpen] = useState(false);

  const handleOpenAuth = (mode: 'LOGIN' | 'SIGNUP') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            Acme Technologies Global
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">•</span>
          <span className="text-xs text-slate-400 hidden sm:inline">Environment: Production Sandbox</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Admin HR Management Button (Only visible if Admin) */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setAdminHrModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage HR & Team</span>
            </button>
          )}

          {/* Quick Demo Switcher */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-400" /> Switch:
            </span>
            <button
              onClick={() => switchDemoRole('RECRUITER')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition ${
                user?.role === 'RECRUITER' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              HR (Alex)
            </button>
            <button
              onClick={() => switchDemoRole('ADMIN')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition ${
                user?.role === 'ADMIN' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Admin (Sarah)
            </button>
            <button
              onClick={() => switchDemoRole('INTERVIEWER')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition ${
                user?.role === 'INTERVIEWER' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Interviewer (David)
            </button>
            <button
              onClick={() => switchDemoRole('HIRING_MANAGER')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition ${
                user?.role === 'HIRING_MANAGER' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Manager (Marcus)
            </button>
            <button
              onClick={() => switchDemoRole('CANDIDATE')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition ${
                user?.role === 'CANDIDATE' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Candidate (Emily)
            </button>
          </div>

          {/* User Status / Login / Signup Buttons */}
          {user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('profile')}
                title="View My Profile"
                className="flex items-center space-x-2.5 p-1 -m-1 rounded-xl hover:bg-slate-800/70 transition text-left group"
              >
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border border-blue-500/40 object-cover group-hover:border-blue-400 transition"
                />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-white group-hover:text-blue-300 transition leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-blue-400 font-semibold">{user?.role}</span>
                    {user?.isVerified && (
                      <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded">OTP OK</span>
                    )}
                  </div>
                </div>
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenAuth('LOGIN')}
                className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => handleOpenAuth('SIGNUP')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up (OTP)
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <AdminHrModal
        isOpen={adminHrModalOpen}
        onClose={() => setAdminHrModalOpen(false)}
      />
    </>
  );
};
