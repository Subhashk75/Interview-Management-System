import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Scale,
  FileText,
  BarChart3,
  AlertTriangle,
  Sparkles,
  Users,
} from 'lucide-react';
import api from '../services/api.ts';
import { Interview, Scorecard, DebriefPacket } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSuccess: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  isOpen,
  onClose,
  interview,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'evaluation' | 'debrief'>('evaluation');
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [isBlinded, setIsBlinded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Debrief Packet State
  const [debriefPacket, setDebriefPacket] = useState<DebriefPacket | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);

  // Admin Unlock State
  const [unlockScorecardId, setUnlockScorecardId] = useState<string | null>(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockSubmitting, setUnlockSubmitting] = useState(false);

  // Form states for current interviewer
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [ratingNotes, setRatingNotes] = useState<{ [key: string]: string }>({});
  const [overallRecommendation, setOverallRecommendation] = useState<
    'STRONG_NO' | 'NO' | 'MIXED' | 'YES' | 'STRONG_YES'
  >('YES');
  const [summaryFeedback, setSummaryFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdminOrRecruiter = ['ADMIN', 'RECRUITER'].includes(user?.role || '');

  const loadScorecards = async () => {
    if (!interview) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res: any = await api.get(`/scorecards/interview/${interview._id}`);
      setScorecards(res.data?.scorecards || []);
      setIsBlinded(res.data?.isBlinded || false);

      // Populate default competencies from round
      const comps = interview?.roundId?.competencies || [
        { name: 'Technical Depth', description: 'Core problem solving & coding', weight: 2 },
        { name: 'System Scalability', description: 'Trade-offs and architectural design', weight: 2 },
        { name: 'Communication & Teamwork', description: 'Clarity and collaborative mindset', weight: 1 },
      ];

      const initialRatings: { [key: string]: number } = {};
      comps.forEach((c) => {
        initialRatings[c.name] = 4;
      });
      setRatings(initialRatings);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load evaluation scorecards');
    } finally {
      setLoading(false);
    }
  };

  const loadDebriefPacket = async () => {
    if (!interview) return;
    setDebriefLoading(true);
    try {
      const res: any = await api.get(`/scorecards/interview/${interview._id}/debrief`);
      setDebriefPacket(res.data || null);
    } catch (err: any) {
      console.error('Failed to load debrief packet:', err);
    } finally {
      setDebriefLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !interview) return;
    loadScorecards();
    loadDebriefPacket();
  }, [isOpen, interview]);

  // Compute live weighted score for the form
  const roundCompetencies = interview?.roundId?.competencies || [];
  const currentLiveWeightedScore = React.useMemo(() => {
    const weightMap = new Map<string, number>();
    roundCompetencies.forEach((c) => weightMap.set(c.name.toLowerCase().trim(), c.weight || 1));

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [name, rating] of Object.entries(ratings)) {
      const weight = weightMap.get(name.toLowerCase().trim()) || 1;
      totalWeightedScore += rating * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
  }, [ratings, roundCompetencies]);

  const handleSubmitScorecard = async (status: 'DRAFT' | 'SUBMITTED' = 'SUBMITTED') => {
    if (!interview) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formattedRatings = Object.keys(ratings).map((name) => ({
        name,
        rating: ratings[name],
        notes: ratingNotes[name] || '',
      }));

      await api.post('/scorecards', {
        interviewId: interview._id,
        ratings: formattedRatings,
        overallRecommendation,
        summaryFeedback: summaryFeedback || 'Candidate demonstrated strong aptitude across core metrics.',
        status,
      });

      await loadScorecards();
      await loadDebriefPacket();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting scorecard');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlockScorecard = async () => {
    if (!unlockScorecardId || !unlockReason.trim()) return;
    setUnlockSubmitting(true);
    try {
      await api.patch(`/scorecards/${unlockScorecardId}/unlock`, {
        reason: unlockReason,
      });
      setUnlockScorecardId(null);
      setUnlockReason('');
      await loadScorecards();
      await loadDebriefPacket();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to unlock scorecard');
    } finally {
      setUnlockSubmitting(false);
    }
  };

  if (!isOpen || !interview) return null;

  const myExistingScorecard = scorecards.find(
    (s) => (s.interviewerId as any)?._id?.toString() === user?._id || (s.interviewerId as any) === user?._id
  );
  const isAlreadySubmitted = myExistingScorecard?.status === 'SUBMITTED' && !myExistingScorecard?.isUnlocked;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Structured Interview Evaluation
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {interview.roundId?.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Candidate: <span className="text-white font-medium">{interview.candidateId?.firstName} {interview.candidateId?.lastName}</span> • Role: <span className="text-white font-medium">{interview.jobId?.title}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'evaluation'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Scorecard Evaluation Form
          </button>
          <button
            onClick={() => {
              setActiveTab('debrief');
              loadDebriefPacket();
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'debrief'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Consolidated Debrief Packet
            {debriefPacket?.metrics?.consensusStatus && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {debriefPacket.metrics.consensusStatus === 'CONSENSUS_HIRE' ? 'Hire' : debriefPacket.metrics.consensusStatus === 'CONSENSUS_NO_HIRE' ? 'No Hire' : 'Review'}
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'evaluation' ? (
            <>
              {/* Anti-Bias Blinding Banner */}
              {isBlinded ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">Anti-Bias Blinding Active</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Peer evaluations and ratings from other panelists are blinded until you submit your own evaluation to prevent conformity bias and groupthink.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">Peer Reviews Unblinded</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      You have submitted your evaluation or hold governance privileges. Peer reviews are now transparently visible.
                    </p>
                  </div>
                </div>
              )}

              {/* Competency Ratings Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-400" /> Competency Rubric & Weighted Scoring
                  </h3>
                  <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-lg">
                    <span className="text-[11px] text-indigo-300">Computed Weighted Score:</span>
                    <span className="text-xs font-black text-white">{currentLiveWeightedScore.toFixed(2)} / 5.0</span>
                  </div>
                </div>

                {Object.keys(ratings).map((compName) => {
                  const compObj = roundCompetencies.find(
                    (c) => c.name.toLowerCase().trim() === compName.toLowerCase().trim()
                  );
                  const weight = compObj?.weight || 1;

                  return (
                    <div key={compName} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{compName}</h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                              Weight: {weight}x
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {compObj?.description || 'Rate candidate against standard role criteria'}
                          </p>
                        </div>

                        {/* 1-5 Star Picker */}
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              disabled={isAlreadySubmitted}
                              onClick={() => setRatings({ ...ratings, [compName]: star })}
                              className={`p-1.5 rounded-lg transition ${
                                ratings[compName] >= star
                                  ? 'text-amber-400 bg-amber-400/10'
                                  : 'text-slate-600 hover:text-slate-400'
                              }`}
                            >
                              <Star className="w-5 h-5 fill-current" />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-slate-300 ml-2">
                            {ratings[compName]} / 5
                          </span>
                        </div>
                      </div>

                      <input
                        type="text"
                        disabled={isAlreadySubmitted}
                        placeholder="Observation notes, specific code examples, or responses..."
                        value={ratingNotes[compName] || ''}
                        onChange={(e) => setRatingNotes({ ...ratingNotes, [compName]: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Overall Recommendation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Overall Hiring Recommendation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'STRONG_NO', label: 'Strong No', color: 'border-rose-500 text-rose-400 bg-rose-500/10' },
                    { id: 'NO', label: 'No', color: 'border-orange-500 text-orange-400 bg-orange-500/10' },
                    { id: 'MIXED', label: 'Mixed / Hold', color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
                    { id: 'YES', label: 'Yes', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
                    { id: 'STRONG_YES', label: 'Strong Yes', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAlreadySubmitted}
                      onClick={() => setOverallRecommendation(opt.id as any)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                        overallRecommendation === opt.id
                          ? `${opt.color} shadow-lg ring-1 ring-white/20`
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Feedback */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Executive Evaluation Summary
                </label>
                <textarea
                  rows={3}
                  disabled={isAlreadySubmitted}
                  value={summaryFeedback}
                  onChange={(e) => setSummaryFeedback(e.target.value)}
                  placeholder="Detail key technical strengths, areas of concern, and level calibration justification..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Panel Review Stream */}
              {scorecards.length > 0 && (
                <div className="border-t border-slate-800 pt-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" /> Panel Review Stream ({scorecards.length})
                    </span>
                  </h3>
                  <div className="space-y-2.5">
                    {scorecards.map((s) => {
                      if (s.isBlinded) {
                        return (
                          <div
                            key={s._id}
                            className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                {s.interviewerId?.firstName?.[0]}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-300">
                                  {s.interviewerId?.firstName} {s.interviewerId?.lastName}
                                </p>
                                <p className="text-[10px] text-amber-400 flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Blinded to protect evaluation neutrality
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {s.status}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={s._id}
                          className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center text-xs font-bold">
                                {s.interviewerId?.firstName?.[0]}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">
                                  {s.interviewerId?.firstName} {s.interviewerId?.lastName}
                                </p>
                                <p className="text-[10px] text-slate-400">{s.interviewerId?.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {s.weightedScore !== undefined && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  Weighted: {s.weightedScore.toFixed(2)} / 5.0
                                </span>
                              )}
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                  s.overallRecommendation?.includes('YES')
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {s.overallRecommendation}
                              </span>

                              {isAdminOrRecruiter && s.status === 'SUBMITTED' && (
                                <button
                                  type="button"
                                  onClick={() => setUnlockScorecardId(s._id)}
                                  className="text-[11px] px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded flex items-center gap-1 transition"
                                  title="Administrative Unlock for corrections"
                                >
                                  <Unlock className="w-3 h-3" /> Unlock
                                </button>
                              )}
                            </div>
                          </div>
                          {s.summaryFeedback && (
                            <p className="text-xs text-slate-300 italic pl-9">"{s.summaryFeedback}"</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Debrief Packet View */
            <div className="space-y-6">
              {debriefLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading Consolidated Debrief Packet...</div>
              ) : debriefPacket ? (
                <div className="space-y-5">
                  {/* Consensus Header Banner */}
                  <div className="p-4 rounded-xl border flex items-center justify-between bg-slate-800/60 border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hiring Consensus Status</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {debriefPacket.metrics.consensusStatus === 'CONSENSUS_HIRE' && (
                            <span className="flex items-center gap-1.5 text-sm font-black text-emerald-400">
                              <Sparkles className="w-4 h-4" /> Strong Consensus to Hire
                            </span>
                          )}
                          {debriefPacket.metrics.consensusStatus === 'CONSENSUS_NO_HIRE' && (
                            <span className="flex items-center gap-1.5 text-sm font-black text-rose-400">
                              <AlertCircle className="w-4 h-4" /> Unanimous No Hire
                            </span>
                          )}
                          {debriefPacket.metrics.consensusStatus === 'DIVERGENT_DEBRIEF_REQUIRED' && (
                            <span className="flex items-center gap-1.5 text-sm font-black text-amber-400">
                              <AlertTriangle className="w-4 h-4" /> Divergent Opinions — Debrief Meeting Required
                            </span>
                          )}
                          {debriefPacket.metrics.consensusStatus === 'PENDING_EVALUATIONS' && (
                            <span className="flex items-center gap-1.5 text-sm font-black text-slate-300">
                              <Lock className="w-4 h-4" /> Awaiting Evaluations from All Panelists
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Average Composite Score</span>
                      <p className="text-lg font-black text-white">
                        {debriefPacket.metrics.averageWeightedScore.toFixed(2)} <span className="text-xs text-slate-400">/ 5.0</span>
                      </p>
                    </div>
                  </div>

                  {/* High Level Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Submissions</span>
                      <p className="text-base font-bold text-white mt-0.5">
                        {debriefPacket.metrics.submittedCount} / {debriefPacket.metrics.totalAssignedPanelists}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">Positive Votes (Yes)</span>
                      <p className="text-base font-bold text-emerald-300 mt-0.5">
                        {debriefPacket.metrics.recommendationsCount.YES + debriefPacket.metrics.recommendationsCount.STRONG_YES}
                      </p>
                    </div>
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-rose-400">Negative Votes (No)</span>
                      <p className="text-base font-bold text-rose-300 mt-0.5">
                        {debriefPacket.metrics.recommendationsCount.NO + debriefPacket.metrics.recommendationsCount.STRONG_NO}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Mixed / Hold Votes</span>
                      <p className="text-base font-bold text-amber-300 mt-0.5">
                        {debriefPacket.metrics.recommendationsCount.MIXED}
                      </p>
                    </div>
                  </div>

                  {/* Side-by-side Panelist Comparison Matrix */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Panel Breakdown & Competency Alignment</h4>
                    <div className="space-y-3">
                      {debriefPacket.scorecards.map((sc) => (
                        <div key={sc._id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">
                                {sc.interviewerId?.firstName?.[0]}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">
                                  {sc.interviewerId?.firstName} {sc.interviewerId?.lastName}
                                </p>
                                <p className="text-[10px] text-slate-400">{sc.interviewerId?.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {sc.weightedScore !== undefined && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  Weighted: {sc.weightedScore.toFixed(2)}
                                </span>
                              )}
                              <span
                                className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                                  sc.overallRecommendation?.includes('YES')
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {sc.overallRecommendation}
                              </span>
                            </div>
                          </div>

                          {/* Competency Ratings Pill Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800">
                            {sc.ratings?.map((r, idx) => (
                              <div key={idx} className="p-2 bg-slate-800/80 rounded-lg flex items-center justify-between">
                                <span className="text-[11px] text-slate-300 truncate max-w-[120px]">{r.name}</span>
                                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-current" /> {r.rating}/5
                                </span>
                              </div>
                            ))}
                          </div>

                          {sc.summaryFeedback && (
                            <p className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 italic">
                              "{sc.summaryFeedback}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">No evaluations submitted yet.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <p className="text-xs text-slate-400">
            {isAlreadySubmitted ? 'Evaluation submitted and locked.' : 'Submitting locks your evaluation.'}
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              Close
            </button>
            {activeTab === 'evaluation' && !isAlreadySubmitted && (
              <button
                type="button"
                onClick={() => handleSubmitScorecard('SUBMITTED')}
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
              >
                {submitting ? 'Submitting...' : 'Submit Final Scorecard'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Unlock Modal Dialog */}
      {unlockScorecardId && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <Unlock className="w-5 h-5" />
              <span>Administrative Unlock for Scorecard</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlocking will revert this evaluation to <span className="font-semibold text-white">DRAFT</span> and reopen the interview status to <span className="font-semibold text-white">IN_PROGRESS</span>. An audit log entry will be preserved.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Reason for Reopening Evaluation <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="e.g., Interviewer requested correction of typo in technical rubric..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUnlockScorecardId(null);
                  setUnlockReason('');
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!unlockReason.trim() || unlockSubmitting}
                onClick={handleUnlockScorecard}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
              >
                {unlockSubmitting ? 'Unlocking...' : 'Confirm Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
