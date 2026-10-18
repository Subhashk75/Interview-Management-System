import React, { useState, useEffect } from 'react';
import { X, Star, Shield, Lock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../services/api.ts';
import { Interview, Scorecard } from '../types/index.ts';
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
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [isBlinded, setIsBlinded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states for current interviewer
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [ratingNotes, setRatingNotes] = useState<{ [key: string]: string }>({});
  const [overallRecommendation, setOverallRecommendation] = useState<
    'STRONG_NO' | 'NO' | 'MIXED' | 'YES' | 'STRONG_YES'
  >('YES');
  const [summaryFeedback, setSummaryFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !interview) return;

    async function loadScorecards() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res: any = await api.get(`/scorecards/interview/${interview?._id}`);
        setScorecards(res.data?.scorecards || []);
        setIsBlinded(res.data?.isBlinded || false);

        // Populate default competencies from round
        const comps = interview?.roundId?.competencies || [
          { name: 'Technical Depth', description: 'Core problem solving & coding' },
          { name: 'System Scalability', description: 'Trade-offs and architectural design' },
          { name: 'Communication & Teamwork', description: 'Clarity and collaborative mindset' },
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
    }

    loadScorecards();
  }, [isOpen, interview]);

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

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting scorecard');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !interview) return null;

  const myExistingScorecard = scorecards.find((s) => s.interviewerId?._id === user?._id);
  const isAlreadySubmitted = myExistingScorecard?.status === 'SUBMITTED';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Structured Interview Evaluation: {interview.candidateId?.firstName} {interview.candidateId?.lastName}
              </h2>
              <p className="text-xs text-slate-400">
                {interview.jobId?.title} • {interview.roundId?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Anti-Bias Blinding Banner */}
          {isBlinded ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300">Anti-Bias Blinding Policy Active</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Peer evaluations and ratings from other panelists are blinded until you submit your own evaluation to prevent conformity bias and groupthink.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300">Panel Reviews Unblinded</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  You have submitted your evaluation or have administrative privileges. Peer evaluations are now transparently visible.
                </p>
              </div>
            </div>
          )}

          {/* Competency Ratings Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Competency Rubric & Scoring (1 = Poor, 5 = Exceptional)
            </h3>

            {Object.keys(ratings).map((compName) => (
              <div key={compName} className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{compName}</h4>
                    <p className="text-[11px] text-slate-400">Rate candidate against standard level criteria</p>
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
                  placeholder="Optional observation notes for this competency..."
                  value={ratingNotes[compName] || ''}
                  onChange={(e) => setRatingNotes({ ...ratingNotes, [compName]: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500"
                />
              </div>
            ))}
          </div>

          {/* Overall Recommendation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Overall Recommendation
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
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Other Panelists' Submissions */}
          {scorecards.length > 0 && (
            <div className="border-t border-slate-800 pt-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" /> Panel Review Stream ({scorecards.length})
              </h3>
              <div className="space-y-2">
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
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            s.overallRecommendation.includes('YES')
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {s.overallRecommendation}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 italic pl-9">"{s.summaryFeedback}"</p>
                    </div>
                  );
                })}
              </div>
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
            {!isAlreadySubmitted && (
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
    </div>
  );
};
