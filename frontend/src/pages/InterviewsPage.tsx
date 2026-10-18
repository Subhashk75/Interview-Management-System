import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  RotateCcw,
  ClipboardCheck,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import api from '../services/api.ts';
import { Interview } from '../types/index.ts';

interface InterviewsPageProps {
  onOpenScorecard: (interview: Interview) => void;
  onOpenSchedule: () => void;
}

export const InterviewsPage: React.FC<InterviewsPageProps> = ({
  onOpenScorecard,
  onOpenSchedule,
}) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/interviews', {
        params: { status: statusFilter || undefined },
      });
      setInterviews(res.data || []);
    } catch (err) {
      console.error('Error loading interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [statusFilter]);

  const handleCancelInterview = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this interview session and release calendar holds?')) return;
    try {
      await api.post(`/interviews/${id}/cancel`, { reason: 'Cancelled by recruiter' });
      loadInterviews();
    } catch (err: any) {
      alert(err.message || 'Error cancelling interview');
    }
  };

  const statusBadgeMap: Record<string, string> = {
    DRAFT: 'bg-slate-700/50 text-slate-300 border-slate-600',
    SCHEDULED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    CONFIRMED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    COMPLETED: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    RESCHEDULED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Interview Lifecycle Management</h2>
          <p className="text-xs text-slate-400">All scheduled rounds, panelist RSVPs, and calendar status</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={onOpenSchedule}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition"
          >
            + Schedule Interview
          </button>
        </div>
      </div>

      {/* Interviews Table / Card List */}
      <div className="space-y-3">
        {interviews.map((item) => {
          const start = new Date(item.startTime);
          const end = new Date(item.endTime);
          const badgeClass = statusBadgeMap[item.status] || 'bg-slate-800 text-slate-400 border-slate-700';

          return (
            <div
              key={item._id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] uppercase font-bold">
                    {start.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="text-sm font-black">{start.getDate()}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">
                      {item.candidateId?.firstName} {item.candidateId?.lastName}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{item.jobId?.title}</span> •{' '}
                    <span className="text-blue-400 font-medium">{item.roundId?.name}</span>
                  </p>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.timezone})
                  </p>
                </div>
              </div>

              {/* Panelists Assigned */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 font-medium">Panel:</span>
                <div className="flex -space-x-2">
                  {item.interviewers?.map((inv: any, idx: number) => (
                    <img
                      key={idx}
                      src={inv.userId?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={inv.userId?.firstName}
                      title={`${inv.userId?.firstName} ${inv.userId?.lastName} (${inv.responseStatus})`}
                      className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover"
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                {item.meetingUrl && item.status !== 'CANCELLED' && (
                  <a
                    href={item.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Video className="w-3.5 h-3.5" /> Meet Link
                  </a>
                )}

                <button
                  onClick={() => onOpenScorecard(item)}
                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Scorecard
                </button>

                {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleCancelInterview(item._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Cancel Interview"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
