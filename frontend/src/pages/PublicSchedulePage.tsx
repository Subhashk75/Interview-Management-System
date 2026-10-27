import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, CheckCircle2, AlertTriangle, Briefcase, UserCheck, Sparkles } from 'lucide-react';
import axios from 'axios';
import { TimeSlot } from '../types/index.ts';

interface PublicSchedulePageProps {
  token: string;
}

export const PublicSchedulePage: React.FC<PublicSchedulePageProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookedResult, setBookedResult] = useState<any>(null);

  const apiBase = '/api/v1';

  useEffect(() => {
    async function loadInvitation() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await axios.get(`${apiBase}/scheduling/public/invitations/${token}`);
        const data = res.data?.data;
        if (data) {
          setInvitation(data.invitation);
          setAvailableSlots(data.availableSlots || []);
          if (data.availableSlots && data.availableSlots.length > 0) {
            setSelectedSlot(data.availableSlots[0]);
          }
        }
      } catch (err: any) {
        setErrorMessage(
          err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to load scheduling invitation.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInvitation();
    }
  }, [token]);

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setErrorMessage('Please select a time slot.');
      return;
    }

    setBookingLoading(true);
    setErrorMessage(null);

    try {
      const res = await axios.post(`${apiBase}/scheduling/public/invitations/${token}/book`, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      setBookedResult(res.data?.data?.interview);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Booking conflict occurred. Please select another slot.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-200">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading interview details & panel availability...</p>
      </div>
    );
  }

  if (errorMessage && !invitation) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Scheduling Link Unavailable</h2>
          <p className="text-xs text-slate-400">{errorMessage}</p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  if (bookedResult) {
    const sDate = new Date(bookedResult.startTime);
    const eDate = new Date(bookedResult.endTime);

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-black text-white tracking-tight">Interview Confirmed!</h1>
            <p className="text-xs text-slate-400">
              We have dispatched your calendar invitations and confirmation email.
            </p>
          </div>

          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl text-left space-y-2 text-xs">
            <p className="text-slate-300 font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              {sDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-slate-300 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({bookedResult.timezone || 'UTC'})
            </p>
            <p className="text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              {invitation?.jobId?.title} • {invitation?.roundId?.name}
            </p>
          </div>

          {bookedResult.meetingUrl && (
            <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl space-y-2">
              <p className="text-xs text-blue-300 font-semibold">Video Conference Meeting Link:</p>
              <a
                href={bookedResult.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                <Video className="w-4 h-4" /> Join Google Meet
              </a>
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            You can close this tab now. A copy of this confirmation has been sent to your registered email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" /> HireSync Pro • Candidate Self-Scheduling
            </div>
            <h1 className="text-xl font-black text-white">Select Your Interview Slot</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Hi <strong>{invitation?.candidateId?.firstName}</strong>, please pick a convenient time from our team's live availability.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold">
              {invitation?.durationMinutes} mins session
            </span>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Details Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Position</span>
            <p className="text-white font-bold">{invitation?.jobId?.title}</p>
            <p className="text-slate-400 text-[11px]">{invitation?.jobId?.department} • {invitation?.jobId?.location}</p>
          </div>

          <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Evaluation Round</span>
            <p className="text-white font-bold">{invitation?.roundId?.name}</p>
            <p className="text-slate-400 text-[11px]">{invitation?.meetingType} video conference</p>
          </div>
        </div>

        {/* Panelists */}
        {invitation?.interviewerIds?.length > 0 && (
          <div>
            <span className="block text-xs font-bold text-slate-300 mb-2">Your Interview Panel:</span>
            <div className="flex flex-wrap gap-2">
              {invitation.interviewerIds.map((inv: any) => (
                <div
                  key={inv._id}
                  className="p-2 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center space-x-2.5"
                >
                  <img
                    src={inv.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={inv.firstName}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-white leading-tight">{inv.firstName} {inv.lastName}</p>
                    <p className="text-[10px] text-slate-400">{inv.title || 'Interviewer'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Mutual Slots */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              Available Time Slots ({availableSlots.length} available)
            </span>
            <span className="text-[11px] text-slate-400">All times shown in your local time</span>
          </div>

          {availableSlots.length === 0 ? (
            <div className="p-6 bg-slate-800/30 border border-slate-800 rounded-2xl text-center space-y-2">
              <p className="text-xs text-slate-300">No mutual slots found for this upcoming week.</p>
              <p className="text-[11px] text-slate-500">
                Please contact your recruiter to arrange alternative time options.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar p-1">
              {availableSlots.map((slot, idx) => {
                const sDate = new Date(slot.startTime);
                const isSelected = selectedSlot?.startTime === slot.startTime;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl border text-left text-xs transition space-y-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-lg shadow-blue-600/30'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <p className="font-semibold">
                      {sDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[11px] opacity-90 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Action */}
        <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {selectedSlot ? (
              <span className="text-emerald-400 font-semibold">
                Ready to schedule for {new Date(selectedSlot.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            ) : (
              <span>Select an available time slot above</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={bookingLoading || !selectedSlot}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 transition"
          >
            {bookingLoading ? 'Confirming Booking...' : 'Confirm & Book Slot'}
          </button>
        </div>
      </div>
    </div>
  );
};
