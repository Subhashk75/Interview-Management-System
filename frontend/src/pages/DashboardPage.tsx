import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Interview } from '../types/index.ts';
import { AdminDashboardView } from '../components/dashboards/AdminDashboardView.tsx';
import { RecruiterDashboardView } from '../components/dashboards/RecruiterDashboardView.tsx';
import { InterviewerDashboardView } from '../components/dashboards/InterviewerDashboardView.tsx';
import { HiringManagerDashboardView } from '../components/dashboards/HiringManagerDashboardView.tsx';
import { CandidateDashboardView } from '../components/dashboards/CandidateDashboardView.tsx';

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
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const res: any = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err: any) {
        console.error('Error fetching role dashboard stats:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      loadStats();
    }
  }, [user?.role, user?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Loading {user?.role || 'User'} Intelligence Hub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-2xl max-w-lg mx-auto mt-10">
        <p className="font-bold">Error loading dashboard</p>
        <p className="mt-1 text-slate-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow"
        >
          Retry
        </button>
      </div>
    );
  }

  const role = user?.role || 'RECRUITER';

  switch (role) {
    case 'ADMIN':
      return (
        <AdminDashboardView
          data={stats}
          onNavigateTab={onNavigateTab}
          onOpenSchedule={() => onOpenSchedule()}
        />
      );

    case 'INTERVIEWER':
      return (
        <InterviewerDashboardView
          data={stats}
          onOpenScorecard={onOpenScorecard}
          onNavigateTab={onNavigateTab}
        />
      );

    case 'MANAGER':
    case 'HIRING_MANAGER':
      return (
        <HiringManagerDashboardView
          data={stats}
          onOpenScorecard={onOpenScorecard}
          onNavigateTab={onNavigateTab}
        />
      );

    case 'CANDIDATE':
      return (
        <CandidateDashboardView
          data={stats}
          onNavigateTab={onNavigateTab}
        />
      );

    case 'HR':
    case 'RECRUITER':
    default:
      return (
        <RecruiterDashboardView
          data={stats}
          onOpenSchedule={onOpenSchedule}
          onOpenScorecard={onOpenScorecard}
          onNavigateTab={onNavigateTab}
        />
      );
  }
};
