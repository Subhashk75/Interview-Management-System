import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, CheckCircle, AlertTriangle, Users, Sparkles } from 'lucide-react';
import api from '../services/api.ts';
import { Candidate, Job, User, TimeSlot } from '../types/index.ts';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedCandidate?: Candidate | null;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedCandidate,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);
  const [meetingType, setMeetingType] = useState<string>('GOOGLE_MEET');

  // Slot generation states
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        const [candRes, jobRes, invRes]: any[] = await Promise.all([
          api.get('/candidates'),
          api.get('/jobs'),
          api.get('/auth/interviewers'),
        ]);
        setCandidates(candRes.data || []);
        setJobs(jobRes.data || []);
        setInterviewers(invRes.data || []);

        if (preselectedCandidate) {
          setSelectedCandidateId(preselectedCandidate._id);
        } else if (candRes.data?.length > 0) {
          setSelectedCandidateId(candRes.data[0]._id);
        }

        if (jobRes.data?.length > 0) {
          const firstJob = jobRes.data[0];
          setSelectedJobId(firstJob._id);
          if (firstJob.rounds?.length > 0) {
            setSelectedRoundId(firstJob.rounds[0]._id);
          }
        }

        if (invRes.data?.length > 0) {
          setSelectedInterviewerIds([invRes.data[0]._id]);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load scheduling dependencies');
      }
    }
    loadData();
  }, [isOpen, preselectedCandidate]);

  // Update round options when job changes
  useEffect(() => {
    const job = jobs.find((j) => j._id === selectedJobId);
    if (job && job.rounds && job.rounds.length > 0) {
      setSelectedRoundId(job.rounds[0]._id);
    }
  }, [selectedJobId, jobs]);

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
        durationMinutes: 60,
        startDate,
        endDate,
        bufferMinutes: 15,
      });
      setAvailableSlots(res.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to calculate available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookInterview = async () => {
    if (!selectedSlot) {
      setErrorMessage('Please select an available time slot');
      return;
    }

    setBookingLoading(true);
    setErrorMessage(null);

    try {
      await api.post('/scheduling/book', {
        candidateId: selectedCandidateId,
        jobId: selectedJobId,
        roundId: selectedRoundId,
        interviewerIds: selectedInterviewerIds,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        meetingType,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking conflict or error occurred');
    } finally {
      setBookingLoading(false);
    }
  };

  const toggleInterviewer = (id: string) => {
    if (selectedInterviewerIds.includes(id)) {
      if (selectedInterviewerIds.length > 1) {
        setSelectedInterviewerIds(selectedInterviewerIds.filter((i) => i !== id));
      }
    } else {
      setSelectedInterviewerIds([...selectedInterviewerIds, id]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Schedule Interview Round</h2>
              <p className="text-xs text-slate-400">Automated multi-panelist intersection engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Candidate Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Candidate</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Job Opening */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Opening</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interview Round */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interview Round</label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {jobs
                .find((j) => j._id === selectedJobId)
                ?.rounds?.map((r) => (
                  <option key={r._id} value={r._id}>
                    Round {r.order}: {r.name} ({r.durationMinutes} mins - {r.type})
                  </option>
                ))}
            </select>
          </div>

          {/* Panelist Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Interviewers (Select Multiple for Panel)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {interviewers.map((inv) => {
                const isSelected = selectedInterviewerIds.includes(inv._id);
                return (
                  <button
                    key={inv._id}
                    type="button"
                    onClick={() => toggleInterviewer(inv._id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={inv.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={inv.firstName}
                      className="w-7 h-7 rounded-full object-cover"
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

          {/* Date Range for Slot Generation */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Availability Window
              </span>
              <button
                type="button"
                onClick={handleGenerateSlots}
                disabled={loadingSlots}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5"
              >
                {loadingSlots ? (
                  'Calculating Intervals...'
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Find Available Slots
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Render Calculated Slots */}
            {availableSlots.length > 0 && (
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1.5">
                  Available Non-Conflicting Slots ({availableSlots.length} found)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                  {availableSlots.slice(0, 12).map((slot, index) => {
                    const startObj = new Date(slot.startTime);
                    const isPicked = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 rounded-lg border text-left text-xs transition ${
                          isPicked
                            ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <p className="font-semibold">{startObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="text-[11px] opacity-90">{startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Video className="w-4 h-4 text-emerald-400" />
            <span>Auto-generates Google Meet Video Link & Invite</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBookInterview}
              disabled={bookingLoading || !selectedSlot}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20"
            >
              {bookingLoading ? 'Atomic Booking...' : 'Confirm & Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
