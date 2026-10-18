import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Clock, Calendar, CheckCircle } from 'lucide-react';
import api from '../services/api.ts';
import { User } from '../types/index.ts';

export const InterviewersPage: React.FC = () => {
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInterviewers() {
      try {
        const res: any = await api.get('/auth/interviewers');
        setInterviewers(res.data || []);
      } catch (err) {
        console.error('Error fetching interviewers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInterviewers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-white tracking-tight">Interviewer Capacity & Skill Matrix</h2>
        <p className="text-xs text-slate-400">
          Load-balanced panelist pools with daily limits and certified evaluation competencies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interviewers.map((inv) => (
          <div
            key={inv._id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
          >
            <div className="flex items-start space-x-3.5">
              <img
                src={inv.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={inv.firstName}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
              />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {inv.firstName} {inv.lastName}
                </h3>
                <p className="text-xs text-blue-400 font-medium">{inv.title || 'Engineer'}</p>
                <p className="text-[10px] text-slate-500">{inv.department || 'Engineering'}</p>
              </div>
            </div>

            {/* Quota Limits */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400">Weekly Quota</span>
                <span className="text-xs font-bold text-emerald-400">{inv.weeklyCapacityHours || 5} hrs/wk</span>
              </div>
              <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400">Daily Cap</span>
                <span className="text-xs font-bold text-blue-400">{inv.dailyInterviewLimit || 2} / day</span>
              </div>
            </div>

            {/* Skills & Domains */}
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 mb-1.5">
                Certified Evaluation Tracks:
              </span>
              <div className="flex flex-wrap gap-1">
                {inv.skills?.map((skill, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Calendar Synced
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Active Pool</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
