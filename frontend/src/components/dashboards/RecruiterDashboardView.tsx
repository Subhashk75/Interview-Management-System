import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  ClipboardList,
  Clock,
  Video,
  CheckCircle,
  Plus,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Send,
  Building,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface RecruiterDashboardViewProps {
  data: any;
  onOpenSchedule: (candidate?: any, jobId?: string) => void;
  onOpenScorecard: (interview: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const RecruiterDashboardView: React.FC<RecruiterDashboardViewProps> = ({
  data,
  onOpenSchedule,
  onOpenScorecard,
  onNavigateTab,
}) => {
  const kpis = data?.kpis || {};
  const funnelStats = data?.funnelStats || {};
  const upcomingInterviews = data?.upcomingInterviews || [];
  const pendingFeedbackNudges = data?.pendingFeedbackNudges || [];
  const openPositions = data?.openPositions || [];
  const recentCandidates = data?.recentCandidates || [];

  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  const handleSendNudge = (panelistName: string, candidateName: string) => {
    setNudgeMessage(`Automated reminder notification sent to ${panelistName} for ${candidateName}'s evaluation!`);
    setTimeout(() => setNudgeMessage(null), 4000);
  };

  const topCards = [
    {
      title: 'Active Candidates',
      value: kpis.activeCandidates ?? 0,
      sub: `${kpis.totalCandidates ?? 0} Total in Database`,
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Open Job Positions',
      value: kpis.openPositions ?? 0,
      sub: 'Active requisitions with open headcount',
      icon: Briefcase,
      color: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Interviews Scheduled',
      value: kpis.interviewsScheduled ?? 0,
      sub: `${kpis.completedInterviews ?? 0} Completed to Date`,
      icon: Calendar,
      color: 'from-purple-600 to-indigo-600',
    },
    {
      title: 'Pending Evaluations',
      value: kpis.pendingEvaluations ?? 0,
      sub: 'Completed interviews awaiting scorecards',
      icon: ClipboardList,
      color: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Recruiter Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 border border-blue-800/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Talent Acquisition & Pipeline Operations</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Recruiter Operations Hub</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage candidates across hiring funnels, coordinate interview panels, resolve scorecard bottlenecks, and monitor open headcount.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('candidates')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidate Kanban</span>
          </button>
          <button
            onClick={() => onOpenSchedule()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      {nudgeMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-400 text-xs font-medium animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{nudgeMessage}</span>
        </div>
      )}

      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((card, idx) => {
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

      {/* 2. Visual Candidate Pipeline Funnel */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Active Hiring Funnel Across All Roles
          </h3>
          <button
            onClick={() => onNavigateTab('candidates')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <span>Open Pipeline Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { stage: 'APPLIED', label: '1. Applied', count: funnelStats.APPLIED || 0, color: 'text-slate-300 border-slate-700 bg-slate-800/60' },
            { stage: 'SCREENING', label: '2. Screening', count: funnelStats.SCREENING || 0, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
            { stage: 'INTERVIEWING', label: '3. Interviewing', count: funnelStats.INTERVIEWING || 0, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
            { stage: 'OFFER', label: '4. Offer', count: funnelStats.OFFER || 0, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
            { stage: 'HIRED', label: '5. Hired', count: funnelStats.HIRED || 0, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
            { stage: 'REJECTED', label: 'Archived', count: funnelStats.REJECTED || 0, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onNavigateTab('candidates')}
              className={`p-3.5 rounded-xl border ${item.color} cursor-pointer hover:scale-[1.02] transition space-y-1`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              <p className="text-xl font-black">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Two-Column Split: Upcoming Interviews & Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews Schedule */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Upcoming Interview Schedule
            </h3>
            <button
              onClick={() => onNavigateTab('interviews')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {upcomingInterviews.length > 0 ? (
              upcomingInterviews.map((inv: any) => (
                <div
                  key={inv._id}
                  className="p-3.5 bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      {inv.candidateId?.firstName} {inv.candidateId?.lastName}
                    </p>
                    <p className="text-[11px] text-blue-400 font-medium">
                      {inv.jobId?.title} • {inv.roundId?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(inv.startTime).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(inv.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.meetingUrl && (
                      <a
                        href={inv.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Video className="w-3.5 h-3.5" /> Meet
                      </a>
                    )}
                    <button
                      onClick={() => onOpenScorecard(inv)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition"
                    >
                      Scorecard
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No upcoming interviews scheduled.</p>
            )}
          </div>
        </div>

        {/* Pending Actions / Attention Overdue Queue */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Pending Scorecards & Reminders ({pendingFeedbackNudges.length})
            </h3>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Needs Follow-up
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
            {pendingFeedbackNudges.length > 0 ? (
              pendingFeedbackNudges.map((item: any) => (
                <div
                  key={item._id}
                  className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">
                        {item.candidate?.firstName} {item.candidate?.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.job?.title} • {item.round?.name}
                      </p>
                    </div>
                    {item.isOverdue && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {item.elapsedHours}h Overdue
                      </span>
                    )}
                  </div>

                  {/* Panelist Reminders */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800">
                    {item.pendingPanelists?.map((p: any) => (
                      <div key={p.userId} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-medium">Panelist: {p.name}</span>
                        <button
                          onClick={() => handleSendNudge(p.name, `${item.candidate?.firstName} ${item.candidate?.lastName}`)}
                          className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <Send className="w-3 h-3" /> Remind
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">All completed evaluations submitted. Great work!</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Active Job Positions Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" /> Active Job Positions ({openPositions.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Position Title</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Openings</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {openPositions.map((job: any) => (
                <tr key={job._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 font-bold text-white">{job.title}</td>
                  <td className="py-3 text-slate-300">{job.department}</td>
                  <td className="py-3 text-slate-400">{job.location}</td>
                  <td className="py-3 font-mono font-bold text-blue-400">{job.openingsCount} Open</td>
                  <td className="py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onOpenSchedule(null, job._id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs font-bold transition"
                    >
                      Schedule
                    </button>
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
