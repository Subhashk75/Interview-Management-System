import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, LogIn, LogOut, UserPlus, Users } from 'lucide-react';
import { AuthModal } from './AuthModal.tsx';
import { AdminHrModal } from './AdminHrModal.tsx';

interface NavbarProps {
  onNavigateTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateTab }) => {
  const { user, logout } = useAuth();
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
        <div className="flex items-center space-x-3" />

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
                Create Account
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
