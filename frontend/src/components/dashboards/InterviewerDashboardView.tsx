import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  ClipboardCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Award,
  ChevronRight,
  Shield,
  Star,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface InterviewerDashboardViewProps {
  data: any;
  onOpenScorecard: (interview: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const InterviewerDashboardView: React.FC<InterviewerDashboardViewProps> = ({
  data,
  onOpenScorecard,
  onNavigateTab,
}) => {
  const kpis = data?.kpis || {};
  const todaysInterviews = data?.todaysInterviews || [];
  const upcomingInterviews = data?.upcomingInterviews || [];
  const pendingScorecards = data?.pendingScorecards || [];
  const recentScorecards = data?.recentScorecards || [];

  const topCards = [
    {
      title: "Today's Interviews",
      value: kpis.todaysInterviewsCount ?? 0,
      sub: 'Sessions scheduled for today',
      icon: Clock,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Pending Scorecards',
      value: kpis.pendingScorecardsCount ?? 0,
      sub: 'Completed interviews awaiting rubric',
      icon: AlertCircle,
      color: 'from-amber-600 to-orange-600',
    },
    {
      title: 'Upcoming Interviews',
      value: kpis.upcomingInterviewsCount ?? 0,
      sub: 'Future assigned sessions',
      icon: Calendar,
      color: 'from-purple-600 to-indigo-600',
    },
    {
      title: 'Weekly Load & Capacity',
      value: `${kpis.hoursBookedThisWeek ?? 0}h / ${kpis.weeklyCapacityHours ?? 5}h`,
      sub: `Max ${kpis.dailyInterviewLimit ?? 2} per day (Burnout protected)`,
      icon: Award,
      color: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Panelist Hero Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Technical Panelist & Evaluation Station</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Interviewer Dashboard & Candidate Prep</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Review your upcoming interview rounds, inspect candidate backgrounds & rubrics, launch Google Meet sessions, and submit structured feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('scorecards')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>My Scorecards</span>
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

      {/* 2. Primary Action: Pending Scorecards Requiring Feedback */}
      {pendingScorecards.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Action Required: {pendingScorecards.length} Evaluation{pendingScorecards.length > 1 ? 's' : ''} Awaiting Your Scorecard
                </h3>
                <p className="text-xs text-slate-300">
                  Submit your evaluation to unblind peer reviews and enable hiring manager calibration.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingScorecards.map((item: any, idx: number) => {
              const inv = item.interview;
              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-800/80 border border-amber-500/20 rounded-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-white">
                        {inv.candidateId?.firstName} {inv.candidateId?.lastName}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.existingDraft ? 'Draft Saved' : 'Not Started'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-400 font-medium">
                      {inv.jobId?.title} • {inv.roundId?.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Conducted: {new Date(inv.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      at {new Date(inv.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenScorecard(inv)}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Complete Scorecard Now</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Upcoming Interviews Prep Kit */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> My Assigned Upcoming Interviews ({upcomingInterviews.length})
          </h3>
          <span className="text-xs text-slate-500">Live Prep Kit</span>
        </div>

        <div className="space-y-4">
          {upcomingInterviews.length > 0 ? (
            upcomingInterviews.map((inv: any) => (
              <div
                key={inv._id}
                className="p-5 bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition rounded-2xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      {inv.candidateId?.firstName} {inv.candidateId?.lastName}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {inv.jobId?.title}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Round: <span className="text-slate-200 font-semibold">{inv.roundId?.name}</span> ({inv.roundId?.durationMinutes || 60} mins)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.meetingUrl && (
                      <a
                        href={inv.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" /> Join Call
                      </a>
                    )}
                    <button
                      onClick={() => onOpenScorecard(inv)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                    >
                      Scorecard Preview
                    </button>
                  </div>
                </div>

                {/* Candidate Background & Candidate Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Profile</span>
                    <p className="text-slate-200">
                      Current: <span className="font-semibold text-white">{inv.candidateId?.currentTitle || 'Software Engineer'}</span> at {inv.candidateId?.currentCompany || 'Tech'}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {inv.candidateId?.skills?.slice(0, 5).map((s: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Round Competencies to Evaluate</span>
                    <div className="flex flex-wrap gap-1.5">
                      {inv.roundId?.competencies?.map((c: any, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md text-[11px] font-medium">
                          {c.name} ({c.weight || 1}x)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-slate-500 bg-slate-800/20 rounded-xl">
              No upcoming interviews assigned to you. You're all caught up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
