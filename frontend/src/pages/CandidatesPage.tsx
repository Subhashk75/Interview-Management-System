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
  Download,
  LayoutGrid,
  Columns3,
  CheckSquare,
  Square,
  ArrowRight,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import api from '../services/api.ts';
import { Candidate, CandidateStage, Job } from '../types/index.ts';
import { CandidateDetailsDrawer } from '../components/CandidateDetailsDrawer.tsx';

interface CandidatesPageProps {
  onScheduleCandidate: (candidate: Candidate) => void;
}

const KANBAN_STAGES: { key: CandidateStage; label: string; headerColor: string; badgeColor: string }[] = [
  { key: 'APPLIED', label: 'Applied', headerColor: 'border-slate-600', badgeColor: 'bg-slate-700 text-slate-300' },
  { key: 'SCREENING', label: 'Screening', headerColor: 'border-blue-500', badgeColor: 'bg-blue-500/20 text-blue-300' },
  { key: 'INTERVIEWING', label: 'Interviewing', headerColor: 'border-indigo-500', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
  { key: 'OFFER', label: 'Offer Extended', headerColor: 'border-emerald-500', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'HIRED', label: 'Hired', headerColor: 'border-purple-500', badgeColor: 'bg-purple-500/20 text-purple-300' },
  { key: 'REJECTED', label: 'Rejected', headerColor: 'border-rose-500', badgeColor: 'bg-rose-500/20 text-rose-300' },
];

export const CandidatesPage: React.FC<CandidatesPageProps> = ({ onScheduleCandidate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'KANBAN'>('GRID');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Selected candidate drawer state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

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
  const [stage, setStage] = useState<CandidateStage>('INTERVIEWING');

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const [candRes, jobRes]: any[] = await Promise.all([
        api.get('/candidates', { params: { search, limit: 100 } }),
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

  // Create candidate
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
      alert(err.response?.data?.message || err.message || 'Error creating candidate');
    }
  };

  // Quick move stage for Kanban card
  const handleQuickMoveStage = async (candidateId: string, targetStage: CandidateStage) => {
    try {
      await api.patch(`/candidates/${candidateId}/stage`, { stage: targetStage });
      setCandidates(candidates.map((c) => (c._id === candidateId ? { ...c, stage: targetStage } : c)));
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to move stage');
    }
  };

  // Bulk selection toggles
  const toggleSelectCandidate = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c._id));
    }
  };

  // Bulk Actions
  const handleBulkSetStage = async (targetStage: CandidateStage) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await api.post('/candidates/bulk-action', {
        candidateIds: selectedIds,
        action: 'SET_STAGE',
        stage: targetStage,
      });
      setBulkFeedback(`Successfully moved ${selectedIds.length} candidates to ${targetStage}`);
      setSelectedIds([]);
      loadCandidates();
      setTimeout(() => setBulkFeedback(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Bulk stage transition failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to archive ${selectedIds.length} selected candidates?`)) return;

    setBulkActionLoading(true);
    try {
      await api.post('/candidates/bulk-action', {
        candidateIds: selectedIds,
        action: 'ARCHIVE',
      });
      setBulkFeedback(`Archived ${selectedIds.length} candidates`);
      setSelectedIds([]);
      loadCandidates();
      setTimeout(() => setBulkFeedback(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Bulk archive failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // CSV Export Download
  const handleExportCsv = async () => {
    try {
      const response = await api.get('/candidates/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'candidates_roster.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export candidates CSV:', err);
      alert('Failed to download CSV export');
    }
  };

  // Filter candidates by search & job filter
  const filteredCandidates = candidates.filter((c) => {
    const job = c.appliedJobId as any;
    const matchesJob = selectedJobFilter === 'ALL' || job?._id === selectedJobFilter;
    return matchesJob;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Candidate Pipeline & Roster</h2>
          <p className="text-xs text-slate-400">
            {filteredCandidates.length} Active Candidates • Visual Kanban Pipeline & Bulk Operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Job Filter Dropdown */}
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Requisitions</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52 sm:w-60"
            />
          </div>

          {/* View Mode Toggle: Grid vs Kanban */}
          <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('GRID')}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'GRID' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('KANBAN')}
              title="Visual Kanban Pipeline Board"
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'KANBAN' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 border border-slate-700 transition"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* Add Candidate Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Bulk Feedback Banner */}
      {bulkFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bulkFeedback}</span>
        </div>
      )}

      {/* Select All Checkbox Bar in Grid View */}
      {viewMode === 'GRID' && filteredCandidates.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 hover:text-white transition font-medium"
          >
            {selectedIds.length === filteredCandidates.length ? (
              <CheckSquare className="w-4 h-4 text-blue-500" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Select All ({filteredCandidates.length} Candidates)</span>
          </button>
          {selectedIds.length > 0 && (
            <span className="text-blue-400 font-bold">{selectedIds.length} Selected</span>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: GRID CARDS VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((c) => {
            const job = c.appliedJobId as any;
            const isSelected = selectedIds.includes(c._id);
            return (
              <div
                key={c._id}
                className={`bg-slate-900 border transition rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between relative cursor-pointer ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => setSelectedCandidateId(c._id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectCandidate(c._id);
                        }}
                        className="mt-0.5 text-slate-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-white hover:text-blue-400 transition">
                          {c.firstName} {c.lastName}
                        </h3>
                        <p className="text-xs text-blue-400 font-medium">{c.currentTitle || 'Software Engineer'}</p>
                      </div>
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
                    {c.skills?.slice(0, 4).map((skill, idx) => (
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
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidateId(c._id);
                      }}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleCandidate(c);
                      }}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Schedule
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: VISUAL KANBAN PIPELINE BOARD VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 overflow-x-auto min-h-[500px]">
          {KANBAN_STAGES.map((col, colIndex) => {
            const stageCandidates = filteredCandidates.filter(
              (c) => (c.stage || 'INTERVIEWING') === col.key
            );
            return (
              <div
                key={col.key}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col space-y-3 shadow-sm min-w-[220px]"
              >
                {/* Column Header */}
                <div className={`border-t-4 ${col.headerColor} pt-2 flex items-center justify-between`}>
                  <h3 className="text-xs font-black text-white">{col.label}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards Column */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[650px] custom-scrollbar pr-0.5">
                  {stageCandidates.map((c) => {
                    const job = c.appliedJobId as any;
                    return (
                      <div
                        key={c._id}
                        onClick={() => setSelectedCandidateId(c._id)}
                        className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-3 space-y-2 cursor-pointer transition shadow-sm"
                      >
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{c.currentTitle || 'Candidate'}</p>
                        </div>

                        {job && (
                          <div className="text-[10px] text-blue-400 font-semibold truncate">
                            🎯 {job.title}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-700/40">
                          <span>{c.currentCompany || 'Experience'}</span>

                          {/* Quick stage advance buttons */}
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            {colIndex > 0 && (
                              <button
                                onClick={() => handleQuickMoveStage(c._id, KANBAN_STAGES[colIndex - 1].key)}
                                title={`Step back to ${KANBAN_STAGES[colIndex - 1].label}`}
                                className="p-1 hover:text-white rounded bg-slate-700/60"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {colIndex < KANBAN_STAGES.length - 1 && (
                              <button
                                onClick={() => handleQuickMoveStage(c._id, KANBAN_STAGES[colIndex + 1].key)}
                                title={`Advance to ${KANBAN_STAGES[colIndex + 1].label}`}
                                className="p-1 hover:text-white rounded bg-blue-600/60 text-blue-200"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stageCandidates.length === 0 && (
                    <div className="p-6 text-center text-[11px] text-slate-600 border border-dashed border-slate-800 rounded-xl">
                      Empty Stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING BULK OPERATIONS TOOLBAR */}
      {/* ========================================================================= */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-3 shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center space-x-2 text-xs text-white font-bold border-r border-slate-700 pr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span>{selectedIds.length} Candidates Selected</span>
          </div>

          {/* Move to Stage Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-semibold">Move Stage:</span>
            <select
              disabled={bulkActionLoading}
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkSetStage(e.target.value as CandidateStage);
                  e.target.value = '';
                }
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Stage...</option>
              {KANBAN_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Archive Selected */}
          <button
            disabled={bulkActionLoading}
            onClick={handleBulkArchive}
            className="px-3 py-1 bg-rose-600/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-lg flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Archive
          </button>

          {/* Clear selection */}
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-400 hover:text-white underline pl-2"
          >
            Deselect
          </button>
        </div>
      )}

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
                    onChange={(e) => setStage(e.target.value as CandidateStage)}
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Skills (comma separated)</label>
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

      {/* Candidate Details Drawer */}
      <CandidateDetailsDrawer
        candidateId={selectedCandidateId}
        isOpen={Boolean(selectedCandidateId)}
        onClose={() => setSelectedCandidateId(null)}
        onScheduleCandidate={(c) => {
          setSelectedCandidateId(null);
          onScheduleCandidate(c);
        }}
        onCandidateUpdated={loadCandidates}
      />
    </div>
  );
};
