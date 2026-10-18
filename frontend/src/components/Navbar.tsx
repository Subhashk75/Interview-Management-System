import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserCheck, Shield, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, switchDemoRole } = useAuth();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          Acme Technologies Global
        </span>
        <span className="text-xs text-slate-500">•</span>
        <span className="text-xs text-slate-400">Environment: Production Sandbox</span>
      </div>

      {/* Role Switcher for Interactive Verification */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" /> View As:
          </span>
          <button
            onClick={() => switchDemoRole('RECRUITER')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              user?.role === 'RECRUITER'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            Recruiter (Alex)
          </button>
          <button
            onClick={() => switchDemoRole('INTERVIEWER')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              user?.role === 'INTERVIEWER'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            Interviewer (David)
          </button>
          <button
            onClick={() => switchDemoRole('ADMIN')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              user?.role === 'ADMIN'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            Admin (Sarah)
          </button>
        </div>

        {/* Current User Pill */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="User avatar"
            className="w-8 h-8 rounded-full border border-blue-500/40 object-cover"
          />
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-blue-400 font-medium">{user?.title || user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
