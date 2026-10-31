import React from 'react';
import {
  Briefcase,
  Calendar,
  Video,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Shield,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CandidateDashboardViewProps {
  data: any;
  onNavigateTab: (tab: string) => void;
}

export const CandidateDashboardView: React.FC<CandidateDashboardViewProps> = ({
  data,
  onNavigateTab,
}) => {
  const kpis = data?.kpis || {};
  const candidate = data?.candidate || {};
  const applications = data?.applications || [];
  const upcomingInterviews = data?.upcomingInterviews || [];
  const completedInterviews = data?.completedInterviews || [];

  const topCards = [
    {
      title: 'Active Applications',
      value: kpis.applicationsSubmitted ?? 0,
      sub: candidate?.appliedJobId?.title || 'Applied Position',
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Interviews Scheduled',
      value: kpis.interviewsScheduled ?? 0,
      sub: 'Upcoming virtual rounds',
      icon: Calendar,
      color: 'from-purple-600 to-indigo-600',
    },
    {
      title: 'Completed Rounds',
      value: kpis.completedInterviewRounds ?? 0,
      sub: 'Interview sessions finished',
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Current Stage',
      value: candidate?.stage || 'INTERVIEWING',
      sub: 'Application progression status',
      icon: Sparkles,
      color: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Candidate Banner */}
      <div className="p-6 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-800/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Candidate Portal & Recruitment Journey</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Welcome, {candidate?.firstName || 'Candidate'}!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Track your job applications, join upcoming virtual interview sessions via Google Meet, and keep your professional portfolio updated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('profile')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-600/20 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>My Profile & Resume</span>
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

      {/* 2. My Application Status Tracker */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-400" /> Active Job Application Status
        </h3>

        {applications.length > 0 ? (
          applications.map((app: any, idx: number) => {
            const stages = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'HIRED'];
            const currentIdx = stages.indexOf(app.stage || 'INTERVIEWING');

            return (
              <div key={idx} className="p-5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-white">{app.job?.title || 'Open Role'}</h4>
                    <p className="text-xs text-slate-400">
                      {app.job?.department || 'Engineering'} • {app.location}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 self-start sm:self-auto">
                    Status: {app.stage || 'INTERVIEWING'}
                  </span>
                </div>

                {/* Progress Step Bar */}
                <div className="pt-2">
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {stages.map((st, sIdx) => {
                      const isPassed = sIdx <= currentIdx;
                      const isCurrent = sIdx === currentIdx;
                      return (
                        <div key={st} className="space-y-1.5">
                          <div
                            className={`h-2 rounded-full transition ${
                              isPassed
                                ? isCurrent
                                  ? 'bg-blue-500 shadow-sm shadow-blue-500/50'
                                  : 'bg-emerald-500'
                                : 'bg-slate-700'
                            }`}
                          />
                          <p
                            className={`text-[10px] font-bold ${
                              isCurrent ? 'text-blue-400' : isPassed ? 'text-slate-200' : 'text-slate-500'
                            }`}
                          >
                            {st}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No active application found. Please check with your recruiter.
          </div>
        )}
      </div>

      {/* 3. Upcoming Interviews (with Join Call Link) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" /> Upcoming Scheduled Interview Sessions ({upcomingInterviews.length})
        </h3>

        <div className="space-y-3">
          {upcomingInterviews.length > 0 ? (
            upcomingInterviews.map((inv: any) => (
              <div
                key={inv._id}
                className="p-4 bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {inv.roundName}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {inv.durationMinutes} Minutes
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
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
                  {inv.meetingUrl ? (
                    <a
                      href={inv.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Google Meet</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Meeting link will appear here</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-800/20 rounded-xl">
              No interview rounds currently scheduled. We will notify you via email as soon as your slot is confirmed!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
