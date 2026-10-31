import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  UserCheck,
  User as UserIcon,
  ShieldCheck,
  Briefcase,
  FileText,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'RECRUITER';

  // Role-Specific Navigation Menus
  const navItems = React.useMemo(() => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
          { id: 'candidates', label: 'Candidate Pipeline', icon: Users },
          { id: 'interviews', label: 'Interviews & Schedule', icon: Calendar },
          { id: 'scorecards', label: 'Evaluations & Debriefs', icon: ClipboardCheck },
          { id: 'interviewers', label: 'Team & Panelist Pool', icon: UserCheck },
          { id: 'profile', label: 'Admin Profile', icon: UserIcon },
        ];

      case 'INTERVIEWER':
        return [
          { id: 'dashboard', label: 'My Dashboard & Prep', icon: LayoutDashboard },
          { id: 'interviews', label: 'My Assigned Interviews', icon: Calendar },
          { id: 'scorecards', label: 'My Scorecards & Feedback', icon: ClipboardCheck },
          { id: 'interviewers', label: 'Panelist Pool & Slots', icon: UserCheck },
          { id: 'profile', label: 'My Profile & Capacity', icon: UserIcon },
        ];

      case 'HIRING_MANAGER':
        return [
          { id: 'dashboard', label: 'Hiring Dashboard', icon: LayoutDashboard },
          { id: 'candidates', label: 'Department Candidates', icon: Users },
          { id: 'interviews', label: 'Interview Progress', icon: Calendar },
          { id: 'scorecards', label: 'Debriefs & Consensus', icon: ClipboardCheck },
          { id: 'profile', label: 'Manager Profile', icon: UserIcon },
        ];

      case 'CANDIDATE':
        return [
          { id: 'dashboard', label: 'Application Portal', icon: LayoutDashboard },
          { id: 'interviews', label: 'My Interviews', icon: Calendar },
          { id: 'profile', label: 'Candidate Profile & CV', icon: UserIcon },
        ];

      case 'RECRUITER':
      default:
        return [
          { id: 'dashboard', label: 'Recruiter Dashboard', icon: LayoutDashboard },
          { id: 'candidates', label: 'Candidates & Pipeline', icon: Users },
          { id: 'interviews', label: 'Interviews & Slots', icon: Calendar },
          { id: 'scorecards', label: 'Evaluations & Scorecards', icon: ClipboardCheck },
          { id: 'interviewers', label: 'Interviewer Pool', icon: UserCheck },
          { id: 'profile', label: 'Recruiter Profile', icon: UserIcon },
        ];
    }
  }, [role]);

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
              HireSync{' '}
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 capitalize">{role.toLowerCase().replace('_', ' ')} Workspace</p>
          </div>
        </div>

        {/* Role Workspace Indicator */}
        <div className="mx-4 mt-3 px-3 py-2 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Role</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              role === 'ADMIN'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : role === 'RECRUITER'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : role === 'INTERVIEWER'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : role === 'HIRING_MANAGER'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            {role.replace('_', ' ')}
          </span>
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
          <span>Role-Based Access Control</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Scorecard blinding & confidential data isolation enforced.
        </p>
      </div>
    </aside>
  );
};
