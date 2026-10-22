import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { CandidatesPage } from './pages/CandidatesPage.tsx';
import { InterviewsPage } from './pages/InterviewsPage.tsx';
import { ScorecardsPage } from './pages/ScorecardsPage.tsx';
import { InterviewersPage } from './pages/InterviewersPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { ScheduleModal } from './components/ScheduleModal.tsx';
import { ScorecardModal } from './components/ScorecardModal.tsx';
import { Candidate, Interview } from './types/index.ts';

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleCandidate, setScheduleCandidate] = useState<Candidate | null>(null);
  const [scheduleJobId, setScheduleJobId] = useState<string | undefined>(undefined);

  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);

  const handleOpenSchedule = (c?: Candidate | null, jobId?: string) => {
    setScheduleCandidate(c || null);
    setScheduleJobId(jobId);
    setIsScheduleOpen(true);
  };

  const handleOpenScheduleForCandidate = (c: Candidate) => {
    setScheduleCandidate(c);
    setScheduleJobId(undefined);
    setIsScheduleOpen(true);
  };

  const handleOpenScorecard = (interview: Interview) => {
    setActiveInterview(interview);
    setIsScorecardOpen(true);
  };

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100">
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onOpenSchedule={handleOpenSchedule}
              onOpenScorecard={handleOpenScorecard}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'candidates' && (
            <CandidatesPage onScheduleCandidate={handleOpenScheduleForCandidate} />
          )}

          {currentTab === 'interviews' && (
            <InterviewsPage
              onOpenScorecard={handleOpenScorecard}
              onOpenSchedule={() => handleOpenSchedule()}
            />
          )}

          {currentTab === 'scorecards' && (
            <ScorecardsPage onOpenScorecard={handleOpenScorecard} />
          )}

          {currentTab === 'interviewers' && <InterviewersPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Interactive Global Modals */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setScheduleCandidate(null);
          setScheduleJobId(undefined);
        }}
        onSuccess={() => {
          // Trigger refresh if needed
        }}
        preselectedCandidate={scheduleCandidate}
        preselectedJobId={scheduleJobId}
      />

      <ScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        interview={activeInterview}
        onSuccess={() => {
          // Trigger refresh if needed
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
