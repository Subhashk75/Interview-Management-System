import React from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  ClipboardCheck,
  Shield,
  Activity,
  UserCheck,
  Award,
  ChevronRight,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
} from 'lucide-react';

interface AdminDashboardViewProps {
  data: any;
  onNavigateTab: (tab: string) => void;
  onOpenSchedule: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  data,
  onNavigateTab,
  onOpenSchedule,
}) => {
  const kpis = data?.kpis || {};
  const userDistribution = data?.userDistribution || {};
  const userList = data?.userList || [];
  const recentAuditLogs = data?.recentAuditLogs || [];
  const recruitmentAnalytics = data?.recruitmentAnalytics || {};

  const kpiCards = [
    {
      title: 'Total Users & Team',
      value: kpis.totalUsers ?? 0,
      sub: `${kpis.totalRecruiters ?? 0} Recruiters • ${kpis.totalInterviewers ?? 0} Panelists`,
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Active Job Requisitions',
      value: kpis.activeJobPositions ?? 0,
      sub: 'Open Positions with headcount',
      icon: Briefcase,
      color: 'from-purple-600 to-indigo-600',
    },
    {
      title: 'Total Candidates In System',
      value: kpis.totalCandidates ?? 0,
      sub: 'Active talent pool roster',
      icon: UserCheck,
      color: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Interviews Conducted',
      value: kpis.totalInterviews ?? 0,
      sub: `${kpis.scheduledInterviews ?? 0} Scheduled • ${kpis.completedInterviews ?? 0} Completed`,
      icon: Calendar,
      color: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Platform Governance & Operations Center</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Executive Administrator Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Global operational overview of enterprise hiring velocity, role permissions, panelist allocations, and tamper-proof audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('candidates')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <span>Candidate Pool</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onOpenSchedule()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* 1. KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</p>
                  <p className="text-2xl font-black text-white mt-1.5">{card.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Platform Overview & User Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Distribution Card */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Organization User Distribution
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Recruiters & Talent Partners', count: userDistribution.RECRUITER || 0, color: 'bg-blue-500' },
              { label: 'Technical Interviewers', count: userDistribution.INTERVIEWER || 0, color: 'bg-emerald-500' },
              { label: 'Hiring Managers', count: userDistribution.HIRING_MANAGER || 0, color: 'bg-amber-500' },
              { label: 'System Administrators', count: userDistribution.ADMIN || 1, color: 'bg-purple-500' },
            ].map((r, i) => (
              <div key={i} className="p-3 bg-slate-800/40 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{r.label}</span>
                  <span className="font-mono font-bold text-white">{r.count}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${r.color} rounded-full`}
                    style={{
                      width: `${Math.min(100, (r.count / Math.max(1, kpis.totalUsers || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('interviewers')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <span>View All Team Members</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Candidate Pipeline Stages & Analytics */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Pipeline Stage Breakdown
          </h3>

          <div className="space-y-2.5">
            {Object.entries(recruitmentAnalytics.candidateStages || {}).length > 0 ? (
              Object.entries(recruitmentAnalytics.candidateStages).map(([stage, count]: any) => (
                <div
                  key={stage}
                  className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-800/60"
                >
                  <span className="text-xs font-bold text-slate-300">{stage}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                    {count} candidates
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No active pipeline records.</p>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('candidates')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <span>Open Candidate Kanban</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* System Audit Log Activity Feed */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" /> Recent Platform Activity
          </h3>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar">
            {recentAuditLogs.length > 0 ? (
              recentAuditLogs.map((log: any) => (
                <div key={log._id} className="p-2.5 bg-slate-800/30 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    User: <span className="font-semibold text-white">{log.userId?.firstName || 'System'}</span>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No recent audit logs.</p>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('scorecards')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <span>Review Evaluations</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. User Roster Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" /> Platform Team Accounts
          </h3>
          <span className="text-xs text-slate-400">{userList.length} members shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">User</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Job Title & Dept</th>
                <th className="pb-3">Verification</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userList.map((u: any) => (
                <tr key={u._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 flex items-center space-x-2.5">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <p className="font-bold text-white">{u.firstName} {u.lastName}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">
                    <p>{u.title || 'Staff'}</p>
                    <p className="text-[11px] text-slate-500">{u.department || 'Operations'}</p>
                  </td>
                  <td className="py-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      OTP OK
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
