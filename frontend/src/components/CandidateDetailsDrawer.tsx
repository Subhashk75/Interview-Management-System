import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  TrendingUp,
  FileText,
  Archive,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api.ts';
import { Candidate, CandidateStage, Interview } from '../types/index.ts';

interface CandidateDetailsDrawerProps {
  candidateId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleCandidate: (candidate: Candidate) => void;
  onCandidateUpdated: () => void;
}

const STAGES: { key: CandidateStage; label: string; color: string }[] = [
  { key: 'APPLIED', label: 'Applied', color: 'bg-slate-700 text-slate-300' },
  { key: 'SCREENING', label: 'Screening', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { key: 'INTERVIEWING', label: 'Interviewing', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { key: 'OFFER', label: 'Offer', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { key: 'HIRED', label: 'Hired', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { key: 'REJECTED', label: 'Rejected', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

export const CandidateDetailsDrawer: React.FC<CandidateDetailsDrawerProps> = ({
  candidateId,
  isOpen,
  onClose,
  onScheduleCandidate,
  onCandidateUpdated,
}) => {
  const [data, setData] = useState<{
    candidate: Candidate;
    interviews: Interview[];
    timeline: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !candidateId) return;
    loadCandidateDetails();
  }, [isOpen, candidateId]);

  const loadCandidateDetails = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res: any = await api.get(`/candidates/${candidateId}`);
      setData(res.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  const handleStageTransition = async (newStage: CandidateStage) => {
    if (!candidateId || !data) return;
    if (data.candidate.stage === newStage) return;

    setUpdatingStage(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await api.patch(`/candidates/${candidateId}/stage`, {
        stage: newStage,
        reason: `Moved from ${data.candidate.stage} to ${newStage} via Candidate Details Drawer`,
      });
      setFeedbackMessage(`Stage updated to ${newStage}`);
      await loadCandidateDetails();
      onCandidateUpdated();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleArchiveCandidate = async () => {
    if (!candidateId) return;
    if (!confirm('Are you sure you want to archive this candidate?')) return;

    try {
      await api.delete(`/candidates/${candidateId}`);
      onCandidateUpdated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to archive candidate');
    }
  };

  if (!isOpen) return null;

  const candidate = data?.candidate;
  const interviews = data?.interviews || [];
  const timeline = data?.timeline || [];
  const appliedJob = candidate?.appliedJobId as any;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white">
                {candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate Profile'}
              </h2>
              {candidate?.stage && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {candidate.stage}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {candidate?.currentTitle || 'Professional'} • {candidate?.currentCompany || 'Technology'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {feedbackMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading candidate profile...</p>
            </div>
          ) : candidate ? (
            <>
              {/* Interactive Stage Stepper */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Hiring Pipeline Progression
                  </span>
                  <span className="text-[11px] text-slate-400">Click any stage to transition</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                  {STAGES.map((s) => {
                    const isCurrent = candidate.stage === s.key;
                    return (
                      <button
                        key={s.key}
                        disabled={updatingStage}
                        onClick={() => handleStageTransition(s.key)}
                        className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-102 ring-2 ring-blue-500/40'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact & Requisition Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Card */}
                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Contact & Profile</h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono">{candidate.email}</span>
                    </p>
                    {candidate.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{candidate.phone}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Timezone: {candidate.timezone || 'UTC'}</span>
                    </p>
                    {candidate.resumeUrl && (
                      <p className="flex items-center gap-2 pt-1">
                        <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <a
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          View Resume Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Applied Requisition Card */}
                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Applied Requisition</h4>
                  {appliedJob ? (
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p className="font-bold text-white text-sm">{appliedJob.title}</p>
                      <p className="text-slate-400 flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-slate-500" />
                        {appliedJob.department} • {appliedJob.location || 'Remote'}
                      </p>
                      {appliedJob.openingsCount && (
                        <p className="text-[11px] text-blue-400 font-semibold pt-1">
                          Headcount: {appliedJob.openingsCount} Openings
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No requisition linked to this profile.</p>
                  )}
                </div>
              </div>

              {/* Skills */}
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Core Competencies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Loop History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" /> Interview Loop & Evaluations ({interviews.length})
                  </h4>
                  <button
                    onClick={() => onScheduleCandidate(candidate)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1"
                  >
                    + Schedule Round
                  </button>
                </div>

                {interviews.length > 0 ? (
                  <div className="space-y-2.5">
                    {interviews.map((inv: any) => {
                      const start = new Date(inv.startTime);
                      const end = new Date(inv.endTime);
                      return (
                        <div
                          key={inv._id}
                          className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-white">
                                {inv.roundId?.name || 'Interview Round'}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  inv.status === 'COMPLETED'
                                    ? 'bg-purple-500/10 text-purple-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                              {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                              {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {inv.meetingUrl && (
                            <a
                              href={inv.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg flex items-center gap-1"
                            >
                              Join Video <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-slate-800/20 border border-slate-800 text-xs text-slate-500">
                    No interview rounds scheduled yet for this candidate.
                  </div>
                )}
              </div>

              {/* Stage Activity Audit Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" /> Pipeline Activity Timeline
                </h4>

                {timeline.length > 0 ? (
                  <div className="border-l-2 border-slate-800 ml-2 space-y-4 py-1">
                    {timeline.map((entry: any) => (
                      <div key={entry._id} className="relative pl-5">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                        <div className="text-xs">
                          <p className="font-semibold text-slate-200">
                            {entry.action === 'STAGE_CHANGED' && (
                              <span>
                                Stage updated: <span className="text-blue-400">{entry.details?.previousStage}</span>{' '}
                                <ArrowRight className="inline w-3 h-3 text-slate-500" />{' '}
                                <span className="text-emerald-400">{entry.details?.newStage}</span>
                              </span>
                            )}
                            {entry.action === 'CANDIDATE_CREATED' && (
                              <span className="text-slate-300">Candidate profile created in pipeline</span>
                            )}
                            {entry.action === 'BULK_STAGE_CHANGED' && (
                              <span>
                                Bulk stage movement to{' '}
                                <span className="text-emerald-400">{entry.details?.targetStage}</span>
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(entry.createdAt).toLocaleString()} • {entry.userId?.firstName || 'System'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-slate-800/20 border border-slate-800 text-xs text-slate-500">
                    Initial candidate creation logged.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={handleArchiveCandidate}
            className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 flex items-center gap-1.5 transition"
          >
            <Archive className="w-3.5 h-3.5" /> Archive Candidate
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Close
            </button>
            {candidate && (
              <button
                onClick={() => {
                  onScheduleCandidate(candidate);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                Schedule Next Round
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
