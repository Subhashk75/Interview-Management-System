import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  UserCheck,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'candidates', label: 'Candidates & Pipeline', icon: Users },
    { id: 'interviews', label: 'Interviews & Slots', icon: Calendar },
    { id: 'scorecards', label: 'Evaluations & Scorecards', icon: ClipboardCheck },
    { id: 'interviewers', label: 'Interviewer Pool', icon: UserCheck },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* App Logo / Brand */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              HireSync <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30">PRO</span>
            </h1>
            <p className="text-xs text-slate-400">Interview Intelligence Engine</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Security & Concurrency Badge */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Anti-Bias Policy Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Scorecard blinding & Redis concurrency locking enabled.
        </p>
      </div>
    </aside>
  );
};
