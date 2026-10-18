import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  ClipboardList,
  ArrowUpRight,
  Clock,
  Video,
  CheckCircle,
  Plus,
  Sparkles,
} from 'lucide-react';
import api from '../services/api.ts';
import { Interview } from '../types/index.ts';

interface DashboardPageProps {
  onOpenSchedule: () => void;
  onOpenScorecard: (interview: Interview) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenSchedule,
  onOpenScorecard,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res: any = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    {
      title: 'Active Pipeline Candidates',
      value: stats?.totalCandidates ?? 0,
      icon: Users,
      trend: '+18% this month',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Open Engineering Roles',
      value: stats?.activeJobs ?? 0,
      icon: Briefcase,
      trend: '4 Active Departments',
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Interviews Coordinated',
      value: stats?.totalInterviews ?? 0,
      icon: Calendar,
      trend: '100% Conflict-Free',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Pending Scorecards',
      value: stats?.pendingScorecardsCount ?? 0,
      icon: ClipboardList,
      trend: 'Blinding Policy Enforced',
      color: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Schedule CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 p-6 rounded-2xl border border-blue-800/40 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Talent Velocity Control Center <Sparkles className="w-5 h-5 text-blue-400" />
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time multi-panelist scheduling with Google Workspace integration, anti-bias scorecard blinding, and distributed concurrency protection.
          </p>
        </div>
        <button
          onClick={onOpenSchedule}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Round</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{c.title}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-tr ${c.color} text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{c.value}</span>
                <span className="text-[11px] font-semibold text-emerald-400">{c.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Interviews & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Upcoming Scheduled Rounds
            </h3>
            <span className="text-xs text-slate-400 font-medium">Auto-Synced with Calendar</span>
          </div>

          <div className="space-y-3">
            {stats?.upcomingInterviews?.length > 0 ? (
              stats.upcomingInterviews.map((item: any) => {
                const start = new Date(item.startTime);
                const end = new Date(item.endTime);
                return (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] uppercase font-bold">
                          {start.toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                        <span className="text-xs font-black">{start.getDate()}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {item.candidateId?.firstName} {item.candidateId?.lastName}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {item.jobId?.title} • <span className="text-blue-400">{item.roundId?.name}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                          {item.timezone})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {item.meetingUrl && (
                        <a
                          href={item.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Meet
                        </a>
                      )}
                      <button
                        onClick={() => onOpenScorecard(item)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        Scorecard
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No interviews scheduled yet. Click "Schedule New Round" to begin.
              </div>
            )}
          </div>
        </div>

        {/* Panelist Workload & Capacity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Interviewer Capacity
            </h3>
            <span className="text-[11px] text-slate-500">Weekly Quotas</span>
          </div>

          <div className="space-y-3">
            {stats?.interviewers?.slice(0, 5).map((inv: any) => (
              <div key={inv._id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-[10px] font-bold">
                      {inv.firstName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        {inv.firstName} {inv.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400">{inv.title}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 text-emerald-400 rounded">
                    {inv.weeklyCapacityHours || 5}h limit
                  </span>
                </div>
                {/* Progress bar simulation */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full w-2/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
