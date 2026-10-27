import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, CheckCircle2, AlertTriangle, Sparkles, UserCheck, ShieldCheck, Link as LinkIcon, Copy } from 'lucide-react';
import api from '../services/api.ts';
import { Candidate, Job, User, TimeSlot } from '../types/index.ts';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedCandidate?: Candidate | null;
  preselectedJobId?: string;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedCandidate,
  preselectedJobId,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);
  const [meetingType, setMeetingType] = useState<string>('GOOGLE_MEET');

  // Schedule mode: 'CUSTOM' or 'SMART_SLOTS'
  const [scheduleMode, setScheduleMode] = useState<'CUSTOM' | 'SMART_SLOTS'>('CUSTOM');

  // Direct custom date/time states (default to tomorrow 10:00 AM)
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
  const [customDate, setCustomDate] = useState<string>(tomorrowDateStr);
  const [customTime, setCustomTime] = useState<string>('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Smart slot search states
  const [startDate, setStartDate] = useState<string>(tomorrowDateStr);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load initial options
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        const [candRes, jobRes, invRes]: any[] = await Promise.all([
          api.get('/candidates'),
          api.get('/jobs'),
          api.get('/auth/interviewers'),
        ]);

        const loadedCandidates: Candidate[] = candRes.data || [];
        const loadedJobs: Job[] = jobRes.data || [];
        const loadedInterviewers: User[] = invRes.data || [];

        setCandidates(loadedCandidates);
        setJobs(loadedJobs);
        setInterviewers(loadedInterviewers);

        // Pre-select candidate
        let activeCandidateId = '';
        if (preselectedCandidate) {
          activeCandidateId = preselectedCandidate._id;
          setSelectedCandidateId(activeCandidateId);
        } else if (loadedCandidates.length > 0) {
          activeCandidateId = loadedCandidates[0]._id;
          setSelectedCandidateId(activeCandidateId);
        }

        // Determine applied job
        const targetCandidate = loadedCandidates.find((c) => c._id === activeCandidateId);
        let activeJobId = preselectedJobId || '';
        if (!activeJobId && targetCandidate?.appliedJobId) {
          activeJobId =
            typeof targetCandidate.appliedJobId === 'string'
              ? targetCandidate.appliedJobId
              : targetCandidate.appliedJobId._id;
        }
        if (!activeJobId && loadedJobs.length > 0) {
          activeJobId = loadedJobs[0]._id;
        }
        setSelectedJobId(activeJobId);

        // Select initial round
        const activeJob = loadedJobs.find((j) => j._id === activeJobId);
        if (activeJob?.rounds?.length) {
          setSelectedRoundId(activeJob.rounds[0]._id);
          if (activeJob.rounds[0].durationMinutes) {
            setDurationMinutes(activeJob.rounds[0].durationMinutes);
          }
        }

        // Select initial interviewer
        if (loadedInterviewers.length > 0) {
          setSelectedInterviewerIds([loadedInterviewers[0]._id]);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load scheduling dependencies');
      }
    }

    loadData();
  }, [isOpen, preselectedCandidate, preselectedJobId]);

  // When selectedCandidateId changes, update job automatically
  const handleCandidateChange = (candId: string) => {
    setSelectedCandidateId(candId);
    const cand = candidates.find((c) => c._id === candId);
    if (cand?.appliedJobId) {
      const jobId = typeof cand.appliedJobId === 'string' ? cand.appliedJobId : cand.appliedJobId._id;
      if (jobId) {
        setSelectedJobId(jobId);
        const job = jobs.find((j) => j._id === jobId);
        if (job?.rounds?.length) {
          setSelectedRoundId(job.rounds[0]._id);
          if (job.rounds[0].durationMinutes) {
            setDurationMinutes(job.rounds[0].durationMinutes);
          }
        }
      }
    }
  };

  // When selectedJobId changes, update round
  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j._id === jobId);
    if (job?.rounds?.length) {
      setSelectedRoundId(job.rounds[0]._id);
      if (job.rounds[0].durationMinutes) {
        setDurationMinutes(job.rounds[0].durationMinutes);
      }
    } else {
      setSelectedRoundId('');
    }
  };

  // Toggle Interviewers
  const toggleInterviewer = (id: string) => {
    if (selectedInterviewerIds.includes(id)) {
      if (selectedInterviewerIds.length > 1) {
        setSelectedInterviewerIds(selectedInterviewerIds.filter((i) => i !== id));
      }
    } else {
      setSelectedInterviewerIds([...selectedInterviewerIds, id]);
    }
  };

  // Smart slot generator
  const handleGenerateSlots = async () => {
    if (selectedInterviewerIds.length === 0) {
      setErrorMessage('Please select at least one interviewer');
      return;
    }
    setLoadingSlots(true);
    setErrorMessage(null);
    setSelectedSlot(null);

    try {
      const res: any = await api.post('/scheduling/slots', {
        interviewerIds: selectedInterviewerIds,
        durationMinutes,
        startDate,
        endDate,
        bufferMinutes: 15,
      });
      const slots = res.data || [];
      setAvailableSlots(slots);
      if (slots.length === 0) {
        setErrorMessage('No conflict-free slots found in this range. Try widening the dates or using Direct Custom Schedule.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to calculate available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    const sDate = new Date(slot.startTime);
    setCustomDate(sDate.toISOString().split('T')[0]);
    const hours = sDate.getHours().toString().padStart(2, '0');
    const minutes = sDate.getMinutes().toString().padStart(2, '0');
    setCustomTime(`${hours}:${minutes}`);
  };

  // Book Interview
  const handleBookInterview = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedCandidateId) {
      setErrorMessage('Please select a candidate.');
      return;
    }
    if (!selectedJobId) {
      setErrorMessage('Please select a job opening.');
      return;
    }
    if (selectedInterviewerIds.length === 0) {
      setErrorMessage('Please select at least one interviewer.');
      return;
    }

    // Determine start & end time
    let startIso: string;
    let endIso: string;

    if (scheduleMode === 'SMART_SLOTS' && selectedSlot) {
      startIso = selectedSlot.startTime;
      endIso = selectedSlot.endTime;
    } else {
      if (!customDate || !customTime) {
        setErrorMessage('Please specify an interview date and time.');
        return;
      }
      const [hours, minutes] = customTime.split(':').map(Number);
      const startObj = new Date(customDate);
      startObj.setHours(hours, minutes, 0, 0);

      const endObj = new Date(startObj.getTime() + durationMinutes * 60 * 1000);
      startIso = startObj.toISOString();
      endIso = endObj.toISOString();
    }

    setBookingLoading(true);

    try {
      await api.post('/scheduling/book', {
        candidateId: selectedCandidateId,
        jobId: selectedJobId,
        roundId: selectedRoundId || undefined,
        interviewerIds: selectedInterviewerIds,
        startTime: startIso,
        endTime: endIso,
        meetingType,
      });

      setSuccessMessage('✅ Interview successfully scheduled! Meeting invites and email notifications dispatched to Candidate, Interviewers, and HR.');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Booking conflict or error occurred');
    } finally {
      setBookingLoading(false);
    }
  };

  // Generate Candidate Self-Scheduling link (Ashby / Greenhouse model)
  const handleGenerateInvitationLink = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedCandidateId) {
      setErrorMessage('Please select a candidate first.');
      return;
    }
    if (!selectedJobId) {
      setErrorMessage('Please select a job opening first.');
      return;
    }
    if (selectedInterviewerIds.length === 0) {
      setErrorMessage('Please select at least one interviewer.');
      return;
    }

    setGeneratingLink(true);

    try {
      const res: any = await api.post('/scheduling/invitations', {
        candidateId: selectedCandidateId,
        jobId: selectedJobId,
        roundId: selectedRoundId || undefined,
        interviewerIds: selectedInterviewerIds,
        durationMinutes,
        meetingType,
      });

      const token = res.data?.token || res.data?.data?.token;
      if (token) {
        const fullLink = `${window.location.origin}/?schedule_token=${token}`;
        setInvitationLink(fullLink);
        await navigator.clipboard.writeText(fullLink);
        setSuccessMessage('📋 Candidate self-scheduling link generated and copied to clipboard! Share it with the candidate to let them choose their slot.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to generate invitation link.');
    } finally {
      setGeneratingLink(false);
    }
  };

  if (!isOpen) return null;

  const currentJob = jobs.find((j) => j._id === selectedJobId);
  const currentRounds = currentJob?.rounds || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Schedule Interview Round</h2>
              <p className="text-xs text-slate-400">Automated calendar sync & email notification dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Row 1: Candidate & Job */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Candidate</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => handleCandidateChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Opening</label>
              <select
                value={selectedJobId}
                onChange={(e) => handleJobChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Interview Round & Meeting Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interview Round</label>
              <select
                value={selectedRoundId}
                onChange={(e) => {
                  setSelectedRoundId(e.target.value);
                  const r = currentRounds.find((round) => round._id === e.target.value);
                  if (r?.durationMinutes) setDurationMinutes(r.durationMinutes);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {currentRounds.length > 0 ? (
                  currentRounds.map((r) => (
                    <option key={r._id} value={r._id}>
                      Round {r.order}: {r.name} ({r.durationMinutes} mins - {r.type})
                    </option>
                  ))
                ) : (
                  <option value="">Default Round 1: Screening & Competency (60 mins)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Video Conferencing Platform</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="GOOGLE_MEET">Google Meet (Auto-generated link)</option>
                <option value="MS_TEAMS">Microsoft Teams</option>
                <option value="ZOOM">Zoom Video</option>
                <option value="IN_PERSON">In-Person Meeting Room</option>
              </select>
            </div>
          </div>

          {/* Panelist Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Assigned Interviewers (Select 1 or more for Panel)
              </label>
              <span className="text-[11px] text-blue-400 font-medium">
                {selectedInterviewerIds.length} Panelist(s) Selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {interviewers.map((inv) => {
                const isSelected = selectedInterviewerIds.includes(inv._id);
                return (
                  <button
                    key={inv._id}
                    type="button"
                    onClick={() => toggleInterviewer(inv._id)}
                    className={`p-2 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={inv.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={inv.firstName}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-200 truncate">
                        {inv.firstName} {inv.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{inv.title || 'Engineer'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scheduling Timing Options: Custom Picker vs Smart Slot Finder */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">Date & Time Selection</span>
              </div>
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setScheduleMode('CUSTOM')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                    scheduleMode === 'CUSTOM'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Time
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('SMART_SLOTS')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition flex items-center gap-1 ${
                    scheduleMode === 'SMART_SLOTS'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Auto Find Slots
                </button>
              </div>
            </div>

            {/* Direct Custom Time Controls */}
            {scheduleMode === 'CUSTOM' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 hr)</option>
                    <option value={90}>90 minutes (1.5 hrs)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Smart Slots Engine */}
            {scheduleMode === 'SMART_SLOTS' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Search From Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Search To Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateSlots}
                    disabled={loadingSlots}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    {loadingSlots ? 'Calculating Intervals...' : 'Find Free Mutual Slots'}
                  </button>
                </div>

                {availableSlots.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold text-emerald-400 mb-1.5">
                      Available Panelist Slots ({availableSlots.length} found):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
                      {availableSlots.slice(0, 9).map((slot, idx) => {
                        const sObj = new Date(slot.startTime);
                        const isPicked = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSlot(slot)}
                            className={`p-2 rounded-lg border text-left text-xs transition ${
                              isPicked
                                ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <p className="font-semibold">
                              {sObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[11px] opacity-90">
                              {sObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Video className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Sends email notifications with Google Meet link to Candidate, Panelists & HR</span>
            <span className="sm:hidden">Sends email invites with video link</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleGenerateInvitationLink}
              disabled={generatingLink}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              title="Generate a self-scheduling link for the candidate to choose their own slot"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {generatingLink ? 'Generating...' : 'Candidate Self-Schedule Link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBookInterview}
              disabled={bookingLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20"
            >
              {bookingLoading ? 'Scheduling & Emailing...' : 'Confirm & Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
