import React from 'react';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Calendar,
  ClipboardCheck,
  Award,
  ChevronRight,
  TrendingUp,
  Star,
  Sparkles,
  AlertTriangle,
  Building,
} from 'lucide-react';

interface HiringManagerDashboardViewProps {
  data: any;
  onOpenScorecard: (interview: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const HiringManagerDashboardView: React.FC<HiringManagerDashboardViewProps> = ({
  data,
  onOpenScorecard,
  onNavigateTab,
}) => {
  const kpis = data?.kpis || {};
  const managerJobs = data?.managerJobs || [];
  const candidatesUnderReview = data?.candidatesUnderReview || [];
  const debriefSummaries = data?.debriefSummaries || [];

  const topCards = [
    {
      title: 'My Open Positions',
      value: kpis.activeJobPositions ?? 0,
      sub: `${kpis.totalApplicants ?? 0} Total Applicants Applied`,
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Candidates In Review',
      value: kpis.candidatesUnderReviewCount ?? 0,
      sub: 'Active in interview pipeline',
      icon: Users,
      color: 'from-purple-600 to-indigo-600',
    },
    {
      title: 'Pending Hiring Decisions',
      value: kpis.pendingHiringDecisionsCount ?? 0,
      sub: 'Debrief ready / Offer stage',
      icon: Award,
      color: 'from-amber-600 to-orange-600',
    },
    {
      title: 'Completed Rounds',
      value: kpis.completedInterviewRounds ?? 0,
      sub: `${kpis.selectedCandidatesCount ?? 0} Hired to date`,
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Department Hiring Leadership & Decision Center</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Hiring Manager Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Monitor requisition velocity, calibrate panel evaluations, resolve divergent feedback, and drive final hiring decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('candidates')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Review Department Candidates</span>
          </button>
        </div>
      </div>

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

      {/* 2. Debrief & Consensus Calibration Queue */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-400" /> Completed Interviews & Calibration Consensus ({debriefSummaries.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cross-panelist consensus and composite weighted scores ready for debrief review.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('scorecards')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Open Debrief Hub
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {debriefSummaries.length > 0 ? (
            debriefSummaries.map((item: any, idx: number) => {
              const inv = item.interview;
              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition rounded-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-white">
                        {inv.candidateId?.firstName} {inv.candidateId?.lastName}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.consensus === 'CONSENSUS_HIRE'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : item.consensus === 'CONSENSUS_NO_HIRE'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {item.consensus.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-indigo-400 font-medium">
                      {inv.jobId?.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Round: <span className="text-slate-300 font-semibold">{inv.roundId?.name}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Avg Weighted Score</span>
                      <p className="font-mono font-black text-white text-sm">
                        {item.averageScore.toFixed(2)} <span className="text-[10px] text-slate-500">/ 5.0</span>
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenScorecard(inv)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Debrief Packet
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center col-span-3">
              No completed sessions awaiting debrief at this time.
            </p>
          )}
        </div>
      </div>

      {/* 3. Requisitions Managed by this Manager */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-400" /> My Active Team Requisitions ({managerJobs.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Job Role</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Headcount</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {managerJobs.map((job: any) => (
                <tr key={job._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 font-bold text-white">{job.title}</td>
                  <td className="py-3 text-slate-300">{job.department}</td>
                  <td className="py-3 text-slate-400">{job.location}</td>
                  <td className="py-3 font-mono font-bold text-blue-400">{job.openingsCount || 1} Openings</td>
                  <td className="py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {job.status}
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
