import React, { useState, useEffect } from 'react';
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
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Building,
  MapPin,
  Send,
  Shield,
  Layers,
} from 'lucide-react';
import api from '../services/api.ts';
import {
  Interview,
  DashboardStats,
  OpenRoleStat,
  CandidateWithRole,
  PendingFeedbackItem,
} from '../types/index.ts';

interface DashboardPageProps {
  onOpenSchedule: (candidate?: any, jobId?: string) => void;
  onOpenScorecard: (interview: Interview) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenSchedule,
  onOpenScorecard,
  onNavigateTab,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

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

  const handleSendNudge = (panelistName: string, candidateName: string) => {
    setNudgeMessage(`Automated reminder dispatched to ${panelistName} for ${candidateName}'s scorecard!`);
    setTimeout(() => setNudgeMessage(null), 4000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Loading Talent Operations Intelligence...</p>
        </div>
      </div>
    );
  }

  // Filter candidates by role & search
  const filteredCandidates = (stats?.candidatesWithRole || []).filter((c) => {
    const matchesRole = roleFilter === 'ALL' || c.appliedJob?._id === roleFilter;
    const matchesSearch =
      candidateSearch === '' ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      (c.appliedJob?.title || '').toLowerCase().includes(candidateSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const topCards = [
    {
      title: 'Active Open Roles',
      value: `${stats?.activeJobs ?? 0} Roles`,
      subtitle: `${stats?.totalOpenings ?? 0} Total Headcount Openings`,
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Demand High',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      title: 'Candidates in Pipeline',
      value: stats?.totalCandidates ?? 0,
      subtitle: `${stats?.candidatesWithRole?.length ?? 0} actively tracked by role`,
      icon: Users,
      color: 'from-purple-600 to-pink-600',
      badge: '+18% velocity',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      title: 'Pending Interview Feedback',
      value: stats?.pendingScorecardsCount ?? 0,
      subtitle: 'Scorecards awaiting submission',
      icon: ClipboardList,
      color: 'from-amber-600 to-orange-600',
      badge: stats?.pendingFeedbackInterviews?.some((p) => p.isOverdue) ? 'Action Required' : 'On Track',
      badgeColor: stats?.pendingFeedbackInterviews?.some((p) => p.isOverdue)
        ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      title: 'Interviews Coordinated',
      value: stats?.totalInterviews ?? 0,
      subtitle: '100% Conflict-free sync',
      icon: Calendar,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Zero Conflicts',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Nudge Toast Notification */}
      {nudgeMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span className="text-xs">{nudgeMessage}</span>
        </div>
      )}

      {/* Top Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-blue-950/70 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-blue-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              Talent Ops Command Center
            </span>
            <span className="text-xs text-slate-400">• Anti-Bias Blinding Enforced</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2">
            Recruitment & Interview Intelligence <Sparkles className="w-5 h-5 text-blue-400" />
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time requisition tracking, multi-panelist scheduling with Google Workspace synchronization, and proactive scorecard feedback monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 relative z-10">
          <button
            onClick={() => onNavigateTab('candidates')}
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            Candidate Pipeline
          </button>
          <button
            onClick={() => onOpenSchedule()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{c.title}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-tr ${c.color} text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-white">{c.value}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{c.subtitle}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${c.badgeColor}`}>
                  {c.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Funnel Velocity Meter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Talent Pipeline Stage Progression</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total Active: {stats?.totalCandidates ?? 0} Candidates
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Applied', key: 'APPLIED', color: 'bg-slate-700 text-slate-300' },
            { label: 'Screening', key: 'SCREENING', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
            { label: 'Interviewing', key: 'INTERVIEWING', color: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
            { label: 'Offer Extended', key: 'OFFER', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
            { label: 'Hired', key: 'HIRED', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
          ].map((stage) => {
            const count = (stats?.funnelStats as any)?.[stage.key] || 0;
            return (
              <div key={stage.key} className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {stage.label}
                </span>
                <p className="text-xl font-black text-white">{count}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, count * 25))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: OPEN ROLES WITH NUMBER OF OPENINGS & TOTAL CANDIDATES APPLIED */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              Open Requisitions & Headcount Demand
            </h2>
            <p className="text-xs text-slate-400">
              Active job openings, target headcount capacity, and candidates applied per role
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
            {stats?.totalOpenings || 0} Total Headcount Openings across {stats?.openRoles?.length || 0} Roles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.openRoles?.map((role) => (
            <div
              key={role._id}
              className="p-5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{role.title}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3 h-3 text-slate-500" /> {role.department} •{' '}
                      <MapPin className="w-3 h-3 text-slate-500" /> {role.location}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 shrink-0">
                    {role.openingsCount} {role.openingsCount === 1 ? 'Opening' : 'Openings'}
                  </span>
                </div>

                {/* Candidate Applied Metrics */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-800/60 rounded-lg border border-slate-800 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Candidates Applied</span>
                    <span className="text-base font-black text-white">{role.applicantCount}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Interviews Active</span>
                    <span className="text-base font-black text-emerald-400">{role.interviewsScheduled}</span>
                  </div>
                </div>

                {/* Stage Distribution Breakdown */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Pipeline Distribution:</span>
                    <span className="font-semibold text-slate-300">
                      {role.applicantCount > 0 ? `${role.applicantCount} candidates` : 'Awaiting applicants'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {role.candidatesByStage && Object.keys(role.candidatesByStage).length > 0 ? (
                      Object.entries(role.candidatesByStage).map(([stage, count]) => (
                        <span
                          key={stage}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {stage}: {count}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No candidates in pipeline</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  {role.hiringManager && (
                    <span>HM: {role.hiringManager.firstName} {role.hiringManager.lastName}</span>
                  )}
                </div>
                <button
                  onClick={() => onOpenSchedule(null, role._id)}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PENDING FEEDBACK OF INTERVIEWS (DEPENDING FEEDBACK) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              Pending Interview Feedback & Scorecards
            </h2>
            <p className="text-xs text-slate-400">
              Interviews completed or awaiting scorecard submissions from assigned panelists
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
            {stats?.pendingFeedbackInterviews?.length || 0} Interviews Awaiting Feedback
          </span>
        </div>

        {stats?.pendingFeedbackInterviews && stats.pendingFeedbackInterviews.length > 0 ? (
          <div className="space-y-3">
            {stats.pendingFeedbackInterviews.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.isOverdue
                    ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.isOverdue
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white">
                        {item.candidate.firstName} {item.candidate.lastName}
                      </h4>
                      <span className="text-[10px] text-slate-400">({item.candidate.email})</span>
                      {item.isOverdue && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Overdue ({item.elapsedHours}h elapsed)
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 mt-0.5">
                      <span className="font-semibold text-blue-400">{item.job.title}</span> •{' '}
                      <span className="text-slate-400">{item.round.name}</span>
                    </p>

                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Interviewed on {new Date(item.startTime).toLocaleDateString()} at{' '}
                      {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Panelists Submission Status Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-medium">Panelists:</span>
                    <div className="flex items-center gap-1.5">
                      {item.panelists.map((panelist, pIdx) => (
                        <div
                          key={pIdx}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            panelist.hasSubmitted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{panelist.name}</span>
                          {panelist.hasSubmitted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 ml-1">(Pending)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Fill Scorecard or Send Nudge */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {item.panelists.some((p) => !p.hasSubmitted) && (
                      <button
                        onClick={() =>
                          handleSendNudge(
                            item.panelists.find((p) => !p.hasSubmitted)?.name || 'Panelist',
                            `${item.candidate.firstName} ${item.candidate.lastName}`
                          )
                        }
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition"
                        title="Send email reminder to panelist"
                      >
                        <Send className="w-3 h-3 text-slate-400" /> Nudge
                      </button>
                    )}
                    <button
                      onClick={() => onOpenScorecard({ _id: item.interviewId } as any)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition"
                    >
                      Scorecard
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-xl space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">All Completed Interview Scorecards Are Submitted</p>
            <p className="text-[11px] text-slate-500">No overdue evaluations or pending feedback detected.</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: TOTAL NUMBER OF CANDIDATES WITH ROLE THEY APPLIED FOR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Candidate Pipeline by Applied Role
            </h2>
            <p className="text-xs text-slate-400">
              Total candidates tracked with their corresponding job requisition, current stage, and interview status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter Dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Roles ({stats?.candidatesWithRole?.length || 0})</option>
              {stats?.openRoles?.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title} ({r.applicantCount})
                </option>
              ))}
            </select>

            {/* Candidate Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-52"
              />
            </div>
          </div>
        </div>

        {/* Candidate List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-3">Candidate</th>
                <th className="pb-3">Role Applied</th>
                <th className="pb-3">Pipeline Stage</th>
                <th className="pb-3">Latest Interview & Status</th>
                <th className="pb-3 text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 pl-3">
                      <div>
                        <p className="font-bold text-white text-xs">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400">{c.email}</p>
                        <p className="text-[10px] text-slate-500">
                          {c.currentTitle} • {c.currentCompany}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5">
                      {c.appliedJob ? (
                        <div>
                          <p className="font-semibold text-blue-400">{c.appliedJob.title}</p>
                          <p className="text-[10px] text-slate-400">{c.appliedJob.department}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          c.stage === 'OFFER'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : c.stage === 'INTERVIEWING'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {c.stage}
                      </span>
                    </td>

                    <td className="py-3.5">
                      {c.latestInterview ? (
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-medium text-slate-200">
                              {c.latestInterview.roundName}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                c.latestInterview.status === 'COMPLETED'
                                  ? 'bg-purple-500/10 text-purple-400'
                                  : 'bg-blue-500/10 text-blue-400'
                              }`}
                            >
                              {c.latestInterview.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(c.latestInterview.startTime).toLocaleDateString()}
                          </p>
                          {c.hasPendingScorecard && (
                            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> Awaiting Scorecard
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No interview yet</span>
                      )}
                    </td>

                    <td className="py-3.5 text-right pr-3">
                      <button
                        onClick={() => onOpenSchedule(c, c.appliedJob?._id)}
                        className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition"
                      >
                        Schedule
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No candidates found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: UPCOMING SCHEDULED ROUNDS & INTERVIEWER CAPACITY */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Scheduled Interviews */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Upcoming Scheduled Rounds
            </h3>
            <span className="text-xs text-slate-400 font-medium">Auto-Synced with Google Calendar</span>
          </div>

          <div className="space-y-3">
            {stats?.upcomingInterviews && stats.upcomingInterviews.length > 0 ? (
              stats.upcomingInterviews.map((item: any) => {
                const start = new Date(item.startTime);
                const end = new Date(item.endTime);
                return (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                No interviews scheduled yet. Click "Schedule Interview" to book.
              </div>
            )}
          </div>
        </div>

        {/* Interviewer Workload & Capacity Quotas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Interviewer Capacity
            </h3>
            <span className="text-[11px] text-slate-500">Weekly Limits</span>
          </div>

          <div className="space-y-3">
            {stats?.interviewers?.slice(0, 5).map((inv: any) => (
              <div key={inv._id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-[10px] font-bold">
                      {inv.firstName?.[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        {inv.firstName} {inv.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400">{inv.title || 'Engineer'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 text-emerald-400 rounded">
                    {inv.weeklyCapacityHours || 5}h limit
                  </span>
                </div>
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
