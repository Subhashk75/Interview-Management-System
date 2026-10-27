import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Star, Calendar, MessageSquare, BarChart3, Scale } from 'lucide-react';
import api from '../services/api.ts';
import { Interview } from '../types/index.ts';

interface ScorecardsPageProps {
  onOpenScorecard: (interview: Interview) => void;
}

export const ScorecardsPage: React.FC<ScorecardsPageProps> = ({ onOpenScorecard }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInterviews() {
      try {
        const res: any = await api.get('/interviews');
        setInterviews(res.data || []);
      } catch (err) {
        console.error('Error fetching interviews for scorecards:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInterviews();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-800/40 rounded-2xl space-y-2">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
          <Shield className="w-5 h-5" />
          <span>Anti-Bias Structured Evaluations & Debrief Calibration</span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Standardized competency rubrics with dynamic weighted scoring eliminate anchoring bias. Peer reviews remain strictly blinded until your individual evaluation is submitted, after which cross-panelist consensus and debrief packets are unlocked.
        </p>
      </div>

      {/* Grid of Interviews needing or having scorecards */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading interview sessions...</div>
      ) : interviews.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          No interviews scheduled yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((item) => {
            const isCompleted = item.status === 'COMPLETED';

            return (
              <div
                key={item._id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-2xl space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {item.candidateId?.firstName} {item.candidateId?.lastName}
                      </h3>
                      <p className="text-xs text-blue-400 font-medium">
                        {item.jobId?.title} • {item.roundId?.name}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isCompleted
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isCompleted ? 'Evaluations Completed' : 'Pending Evaluation'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-xl space-y-1.5 text-xs text-slate-300">
                    <p className="font-semibold text-slate-200">Assigned Panelists:</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.interviewers?.map((inv: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-800 text-[11px] rounded border border-slate-700 text-slate-300"
                        >
                          {inv.userId?.firstName} {inv.userId?.lastName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.startTime).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onOpenScorecard(item)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    {isCompleted ? (
                      <>
                        <BarChart3 className="w-3.5 h-3.5" /> Debrief & Reviews
                      </>
                    ) : (
                      <>
                        <Scale className="w-3.5 h-3.5" /> Submit Scorecard
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
