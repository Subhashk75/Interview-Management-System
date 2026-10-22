import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Calendar,
  ExternalLink,
  ChevronRight,
  Building,
} from 'lucide-react';
import api from '../services/api.ts';
import { Candidate, Job } from '../types/index.ts';

interface CandidatesPageProps {
  onScheduleCandidate: (candidate: Candidate) => void;
}

export const CandidatesPage: React.FC<CandidatesPageProps> = ({ onScheduleCandidate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Candidate Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [experienceYears, setExperienceYears] = useState(4);
  const [skills, setSkills] = useState('React, TypeScript, Node.js');
  const [appliedJobId, setAppliedJobId] = useState('');
  const [stage, setStage] = useState('INTERVIEWING');

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const [candRes, jobRes]: any[] = await Promise.all([
        api.get('/candidates', { params: { search } }),
        api.get('/jobs'),
      ]);
      setCandidates(candRes.data || []);
      setJobs(jobRes.data || []);
      if (jobRes.data?.length > 0 && !appliedJobId) {
        setAppliedJobId(jobRes.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [search]);

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/candidates', {
        firstName,
        lastName,
        email,
        phone,
        currentCompany,
        currentTitle,
        experienceYears,
        skills: skills.split(',').map((s) => s.trim()),
        appliedJobId: appliedJobId || undefined,
        stage,
      });
      setIsAddModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCurrentCompany('');
      setCurrentTitle('');
      loadCandidates();
    } catch (err: any) {
      alert(err.message || 'Error creating candidate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Candidate Pipeline & Roster</h2>
          <p className="text-xs text-slate-400">Normalized candidate profiles with full interview lifecycle</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Candidate List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((c) => {
          const job = c.appliedJobId as any;
          return (
            <div
              key={c._id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {c.firstName} {c.lastName}
                    </h3>
                    <p className="text-xs text-blue-400 font-medium">{c.currentTitle || 'Software Engineer'}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {c.currentCompany || 'Tech'}
                  </span>
                </div>

                {/* Target Applied Role */}
                {job && (
                  <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Applied Role:</span>
                      <span className="font-bold text-slate-200">{job.title}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                      {c.stage || 'INTERVIEWING'}
                    </span>
                  </div>
                )}

                <div className="space-y-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" /> {c.email}
                  </p>
                  {c.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> {c.phone}
                    </p>
                  )}
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Added {new Date(c.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onScheduleCandidate(c)}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                >
                  <Calendar className="w-3.5 h-3.5" /> Schedule
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Candidate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Candidate Profile</h3>
            <form onSubmit={handleCreateCandidate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                />
              </div>

              {/* Target Applied Role Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Applied Job Opening</label>
                  <select
                    value={appliedJobId}
                    onChange={(e) => setAppliedJobId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                  >
                    <option value="">-- Select Role --</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title} ({j.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pipeline Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="SCREENING">Screening</option>
                    <option value="INTERVIEWING">Interviewing</option>
                    <option value="OFFER">Offer</option>
                    <option value="HIRED">Hired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Current Company</label>
                  <input
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Current Title</label>
                  <input
                    type="text"
                    value={currentTitle}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
