import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Shield,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Linkedin,
  Globe,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Camera,
  Save,
  RotateCcw,
  Plus,
  X,
  Building,
  Award,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { User, ProfileCompletionStats } from '../types/index.ts';

// Validation helpers
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:[0-9]+)?(\/.*)?$/;

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
];

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, updateUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<ProfileCompletionStats | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Avatar picker modal/toggle
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    dateOfBirth: '',
    gender: '',
    avatarUrl: '',
    // Professional
    title: '',
    department: '',
    bio: '',
    linkedinUrl: '',
    // Role-specific
    hiringSpecialization: '',
    assignedHiringTeams: [] as string[],
    skills: [] as string[],
    experienceYears: 0,
    weeklyCapacityHours: 5,
    dailyInterviewLimit: 2,
    interviewSpecializations: [] as string[],
    // Candidate
    currentCompany: '',
    education: '',
    portfolioUrl: '',
    resumeUrl: '',
  });

  // Track original values to detect dirty state and allow cancel/reset
  const [initialData, setInitialData] = useState<typeof formData | null>(null);

  // New tag inputs
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newTeamInput, setNewTeamInput] = useState('');
  const [newSpecInput, setNewSpecInput] = useState('');

  // Load Profile from API
  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res: any = await api.get('/profile/me');
      const u = res.data?.user || user;
      const s = res.data?.stats || null;

      const populated = {
        firstName: u?.firstName || '',
        lastName: u?.lastName || '',
        email: u?.email || '',
        phone: u?.phone || '',
        location: u?.location || '',
        dateOfBirth: u?.dateOfBirth || '',
        gender: u?.gender || '',
        avatarUrl: u?.avatarUrl || '',
        title: u?.title || '',
        department: u?.department || '',
        bio: u?.bio || '',
        linkedinUrl: u?.linkedinUrl || '',
        hiringSpecialization: u?.hiringSpecialization || '',
        assignedHiringTeams: u?.assignedHiringTeams || [],
        skills: u?.skills || [],
        experienceYears: u?.experienceYears !== undefined ? u.experienceYears : 0,
        weeklyCapacityHours: u?.weeklyCapacityHours || 5,
        dailyInterviewLimit: u?.dailyInterviewLimit || 2,
        interviewSpecializations: u?.interviewSpecializations || [],
        currentCompany: u?.currentCompany || '',
        education: u?.education || '',
        portfolioUrl: u?.portfolioUrl || '',
        resumeUrl: u?.resumeUrl || '',
      };

      setFormData(populated);
      setInitialData(populated);
      setStats(s);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setErrorMessage(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?._id]);

  // Is dirty calculation
  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  // Frontend Field Validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const role = user?.role || 'INTERVIEWER';

    // 1. Mandatory Common Fields
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is mandatory.';
    } else if (formData.firstName.trim().length > 50) {
      errors.firstName = 'First name cannot exceed 50 characters.';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is mandatory.';
    } else if (formData.lastName.trim().length > 50) {
      errors.lastName = 'Last name cannot exceed 50 characters.';
    }

    // Phone validation
    if (formData.phone.trim()) {
      if (!PHONE_REGEX.test(formData.phone.trim())) {
        errors.phone = 'Please enter a valid phone number (e.g. +1 555-0199 or 10-15 digits).';
      }
    } else if (role === 'RECRUITER' || role === 'CANDIDATE') {
      errors.phone = `Phone number is required for ${role === 'RECRUITER' ? 'Recruiters' : 'Candidates'}.`;
    }

    // Bio length
    if (formData.bio && formData.bio.trim().length > 1000) {
      errors.bio = 'Bio cannot exceed 1000 characters.';
    }

    // URLs validation
    if (formData.linkedinUrl.trim()) {
      if (!URL_REGEX.test(formData.linkedinUrl.trim()) || !formData.linkedinUrl.toLowerCase().includes('linkedin.com/')) {
        errors.linkedinUrl = 'Please provide a valid LinkedIn URL (e.g. https://linkedin.com/in/username).';
      }
    }

    if (formData.portfolioUrl.trim()) {
      if (!URL_REGEX.test(formData.portfolioUrl.trim())) {
        errors.portfolioUrl = 'Portfolio must be a valid URL.';
      }
    }

    if (formData.resumeUrl.trim()) {
      if (!URL_REGEX.test(formData.resumeUrl.trim())) {
        errors.resumeUrl = 'Resume must be a valid URL.';
      }
    }

    // Role-specific mandatory checks
    if (['ADMIN', 'RECRUITER', 'INTERVIEWER'].includes(role)) {
      if (!formData.title.trim()) {
        errors.title = 'Job title is mandatory.';
      }
      if (!formData.department.trim()) {
        errors.department = 'Department is mandatory.';
      }
    }

    if (role === 'RECRUITER') {
      if (!formData.hiringSpecialization.trim()) {
        errors.hiringSpecialization = 'Hiring specialization is mandatory for Recruiters.';
      }
    }

    if (role === 'INTERVIEWER') {
      if (formData.skills.length === 0) {
        errors.skills = 'At least one technical competency or skill is required for Interviewers.';
      }
      if (formData.experienceYears < 0 || isNaN(formData.experienceYears)) {
        errors.experienceYears = 'Years of experience must be 0 or greater.';
      }
      if (formData.weeklyCapacityHours < 1 || formData.weeklyCapacityHours > 40) {
        errors.weeklyCapacityHours = 'Weekly capacity must be between 1 and 40 hours.';
      }
      if (formData.dailyInterviewLimit < 1 || formData.dailyInterviewLimit > 10) {
        errors.dailyInterviewLimit = 'Daily limit must be between 1 and 10 interviews.';
      }
    }

    if (role === 'CANDIDATE') {
      if (formData.skills.length === 0) {
        errors.skills = 'Please specify at least one core skill.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Live dynamic completion recalculator
  const liveStats = useMemo(() => {
    if (!user) return stats;
    const role = user.role;
    let mandatoryTotal = 0;
    let mandatoryCompleted = 0;
    let optionalTotal = 0;
    let optionalCompleted = 0;
    const missingMandatory: string[] = [];

    // Helper
    const check = (isMandatory: boolean, val: any, label: string) => {
      let isDone = false;
      if (Array.isArray(val)) isDone = val.length > 0;
      else if (typeof val === 'number') isDone = !isNaN(val) && val >= 0;
      else if (typeof val === 'string') isDone = val.trim().length > 0;

      if (isMandatory) {
        mandatoryTotal++;
        if (isDone) mandatoryCompleted++;
        else missingMandatory.push(label);
      } else {
        optionalTotal++;
        if (isDone) optionalCompleted++;
      }
    };

    check(true, formData.firstName, 'First Name');
    check(true, formData.lastName, 'Last Name');
    check(true, formData.email, 'Email Address');

    if (role === 'ADMIN') {
      check(true, formData.title, 'Job Title');
      check(true, formData.department, 'Department');
      check(false, formData.phone, 'Phone Number');
      check(false, formData.location, 'Location');
      check(false, formData.bio, 'Professional Bio');
      check(false, formData.linkedinUrl, 'LinkedIn Profile');
    } else if (role === 'RECRUITER') {
      check(true, formData.phone, 'Contact Phone Number');
      check(true, formData.title, 'Job Title');
      check(true, formData.department, 'Department');
      check(true, formData.hiringSpecialization, 'Hiring Specialization');
      check(false, formData.location, 'Location');
      check(false, formData.assignedHiringTeams, 'Assigned Teams');
      check(false, formData.bio, 'Professional Bio');
      check(false, formData.linkedinUrl, 'LinkedIn Profile');
    } else if (role === 'INTERVIEWER') {
      check(true, formData.title, 'Job Title');
      check(true, formData.department, 'Department');
      check(true, formData.skills, 'Skills & Competencies');
      check(true, formData.experienceYears, 'Years of Experience');
      check(false, formData.phone, 'Phone Number');
      check(false, formData.location, 'Location');
      check(false, formData.interviewSpecializations, 'Specializations');
      check(false, formData.bio, 'Professional Bio');
      check(false, formData.linkedinUrl, 'LinkedIn Profile');
    } else if (role === 'CANDIDATE') {
      check(true, formData.phone, 'Contact Phone Number');
      check(true, formData.skills, 'Key Skills');
      check(false, formData.currentCompany, 'Current Company');
      check(false, formData.education, 'Education');
      check(false, formData.resumeUrl, 'Resume Document');
      check(false, formData.linkedinUrl, 'LinkedIn Profile');
      check(false, formData.bio, 'Summary Bio');
    }

    const mandatoryScore = mandatoryTotal > 0 ? (mandatoryCompleted / mandatoryTotal) * 70 : 70;
    const optionalScore = optionalTotal > 0 ? (optionalCompleted / optionalTotal) * 30 : 30;
    let percentage = Math.round(mandatoryScore + optionalScore);

    if (missingMandatory.length > 0) {
      percentage = Math.min(percentage, 75);
    }
    if (missingMandatory.length === 0 && optionalCompleted === optionalTotal) {
      percentage = 100;
    }

    return {
      percentage,
      totalFields: mandatoryTotal + optionalTotal,
      completedFields: mandatoryCompleted + optionalCompleted,
      missingMandatoryFields: missingMandatory,
      missingOptionalFields: [],
      requirements: stats?.requirements || [],
      isFullyComplete: missingMandatory.length === 0 && percentage === 100,
    };
  }, [formData, user, stats]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage('Please resolve the highlighted validation errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateUserProfile(formData);
      setSuccessMessage('Profile saved and updated successfully!');
      if (res?.stats) {
        setStats(res.stats);
      }
      setInitialData({ ...formData });
      await refreshUser();
    } catch (err: any) {
      console.error('Save failed:', err);
      const serverErrors = err.response?.data?.error?.details;
      if (serverErrors && typeof serverErrors === 'object') {
        setFieldErrors(serverErrors);
        setErrorMessage('Server validation failed on one or more fields.');
      } else {
        setErrorMessage(err.response?.data?.error?.message || err.message || 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle Discard
  const handleReset = () => {
    if (initialData) {
      setFormData({ ...initialData });
      setFieldErrors({});
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  };

  // Add tag helpers
  const handleAddSkill = () => {
    const val = newSkillInput.trim();
    if (val && !formData.skills.includes(val)) {
      setFormData({ ...formData, skills: [...formData.skills, val] });
      setNewSkillInput('');
      setFieldErrors({ ...fieldErrors, skills: '' });
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  const handleAddTeam = () => {
    const val = newTeamInput.trim();
    if (val && !formData.assignedHiringTeams.includes(val)) {
      setFormData({ ...formData, assignedHiringTeams: [...formData.assignedHiringTeams, val] });
      setNewTeamInput('');
    }
  };

  const handleRemoveTeam = (team: string) => {
    setFormData({
      ...formData,
      assignedHiringTeams: formData.assignedHiringTeams.filter((t) => t !== team),
    });
  };

  const handleAddSpec = () => {
    const val = newSpecInput.trim();
    if (val && !formData.interviewSpecializations.includes(val)) {
      setFormData({ ...formData, interviewSpecializations: [...formData.interviewSpecializations, val] });
      setNewSpecInput('');
    }
  };

  const handleRemoveSpec = (spec: string) => {
    setFormData({
      ...formData,
      interviewSpecializations: formData.interviewSpecializations.filter((s) => s !== spec),
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Loading user profile & credentials...</p>
      </div>
    );
  }

  const role = user?.role || 'INTERVIEWER';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-blue-500" />
            Role-Based Profile Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal profile, credentials, and role-specific recruitment settings.
          </p>
        </div>

        {/* Global Save / Discard Actions */}
        <div className="flex items-center space-x-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Discard
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-2 ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 ring-2 ring-blue-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>

      {/* Global Banners */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-400 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-3 text-rose-400 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isDirty && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-amber-300 text-xs">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> You have unsaved profile modifications.
          </span>
          <span className="text-[11px] font-semibold text-amber-400/80">Press "Save Profile Changes" to persist</span>
        </div>
      )}

      {/* 1. Profile Header Hero Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          {/* Avatar with Overlay Button */}
          <div className="relative group">
            <img
              src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt="Profile Avatar"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/40 shadow-md group-hover:opacity-90 transition"
            />
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              title="Change Profile Picture"
              className="absolute inset-0 bg-slate-950/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-black text-white">
                {formData.firstName || user?.firstName} {formData.lastName || user?.lastName}
              </h2>
              {/* Role Badge */}
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  role === 'ADMIN'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : role === 'RECRUITER'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : role === 'INTERVIEWER'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {role}
              </span>
            </div>

            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{formData.title || user?.title || 'Team Member'}</span>
              <span>•</span>
              <span className="text-slate-400">{formData.department || user?.department || 'Operations'}</span>
            </p>

            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {formData.email || user?.email}
              </span>
              {formData.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {formData.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Organization / Security Notice */}
        <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1 max-w-xs text-xs">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold">
            <Building className="w-4 h-4 text-blue-400" />
            <span>Acme Technologies Global</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your role is verified and managed by enterprise administrators. Role modifications cannot be self-assigned.
          </p>
        </div>
      </div>

      {/* Avatar Picker Drawer (Expandable) */}
      {showAvatarPicker && (
        <div className="p-4 bg-slate-900 border border-blue-500/30 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-400" /> Choose Profile Photo or Enter Image URL
            </h4>
            <button
              onClick={() => setShowAvatarPicker(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {AVATAR_PRESETS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, avatarUrl: url });
                  setShowAvatarPicker(false);
                }}
                className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition ${
                  formData.avatarUrl === url
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="url"
              placeholder="Or paste direct image URL (https://...)"
              value={customAvatarUrl}
              onChange={(e) => setCustomAvatarUrl(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                if (customAvatarUrl.trim()) {
                  setFormData({ ...formData, avatarUrl: customAvatarUrl.trim() });
                  setCustomAvatarUrl('');
                  setShowAvatarPicker(false);
                }
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* 2. Profile Completion Progress Card */}
      {liveStats && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Profile Completeness Score
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  liveStats.percentage === 100
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : liveStats.percentage >= 70
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {liveStats.percentage}% Complete
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                liveStats.percentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                  : liveStats.percentage >= 70
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${liveStats.percentage}%` }}
            />
          </div>

          {/* Missing Mandatory Checklist */}
          {liveStats.missingMandatoryFields.length > 0 ? (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Missing Required Fields:
              </span>
              {liveStats.missingMandatoryFields.map((field, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded text-[10px] font-semibold"
                >
                  * {field}
                </span>
              ))}
            </div>
          ) : (
            <div className="pt-1 text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" /> All mandatory requirements for your role are satisfied!
            </div>
          )}
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION A: Basic Personal Information */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-400" />
              Basic Personal Information
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identity details used across meeting scheduling and evaluation records.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  setFieldErrors({ ...fieldErrors, firstName: '' });
                }}
                className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                  fieldErrors.firstName
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
                placeholder="e.g. Sarah"
              />
              {fieldErrors.firstName && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  setFieldErrors({ ...fieldErrors, lastName: '' });
                }}
                className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                  fieldErrors.lastName
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
                placeholder="e.g. Connor"
              />
              {fieldErrors.lastName && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.lastName}
                </p>
              )}
            </div>

            {/* Email Address (Protected) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full bg-slate-800/50 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Verified
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Authentication identifier. Email cannot be changed without re-verification.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Contact Phone Number {(role === 'RECRUITER' || role === 'CANDIDATE') && <span className="text-rose-400">*</span>}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  setFieldErrors({ ...fieldErrors, phone: '' });
                }}
                className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                  fieldErrors.phone
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
                placeholder="+1 555-0199 or +91 9876543210"
              />
              {fieldErrors.phone ? (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.phone}
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports international format with country code (e.g. +1, +44, +91).
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Location (City, Country / Remote)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                placeholder="e.g. San Francisco, CA or Remote"
              />
            </div>

            {/* Gender / DOB */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Role-Specific Professional Information */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5 shadow-sm">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                Role-Specific Professional Details ({role})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fields and criteria tailored specifically to your active <span className="text-white font-semibold">{role}</span> profile.
              </p>
            </div>
          </div>

          {/* RECRUITER SPECIFIC FORM */}
          {role === 'RECRUITER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Job Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Job Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setFieldErrors({ ...fieldErrors, title: '' });
                    }}
                    placeholder="e.g. Senior Technical Recruiter"
                    className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                      fieldErrors.title
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => {
                      setFormData({ ...formData, department: e.target.value });
                      setFieldErrors({ ...fieldErrors, department: '' });
                    }}
                    placeholder="e.g. Talent Acquisition"
                    className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                      fieldErrors.department
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.department && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.department}</p>
                  )}
                </div>
              </div>

              {/* Hiring Specialization */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Hiring Specialization <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hiringSpecialization}
                  onChange={(e) => {
                    setFormData({ ...formData, hiringSpecialization: e.target.value });
                    setFieldErrors({ ...fieldErrors, hiringSpecialization: '' });
                  }}
                  placeholder="e.g. Engineering & Infrastructure, Executive Search, Sales"
                  className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                    fieldErrors.hiringSpecialization
                      ? 'border-rose-500 ring-1 ring-rose-500/50'
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.hiringSpecialization && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.hiringSpecialization}</p>
                )}
              </div>

              {/* Assigned Hiring Teams Tag Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Assigned Hiring Teams
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.assignedHiringTeams.map((team, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold"
                    >
                      {team}
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(team)}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTeamInput}
                    onChange={(e) => setNewTeamInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTeam())}
                    placeholder="Add team (e.g. Core Platform, AI/ML, Frontend) and press Enter"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTeam}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INTERVIEWER SPECIFIC FORM */}
          {role === 'INTERVIEWER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Job Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setFieldErrors({ ...fieldErrors, title: '' });
                    }}
                    placeholder="e.g. Staff Distributed Systems Engineer"
                    className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                      fieldErrors.title
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => {
                      setFormData({ ...formData, department: e.target.value });
                      setFieldErrors({ ...fieldErrors, department: '' });
                    }}
                    placeholder="e.g. Platform Engineering"
                    className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                      fieldErrors.department
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.department && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.department}</p>
                  )}
                </div>
              </div>

              {/* Skills and Competencies Tag Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Technical Skills & Competencies <span className="text-rose-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add skill (e.g. System Design, Kubernetes, TypeScript) and press Enter"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                {fieldErrors.skills && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.skills}
                  </p>
                )}
              </div>

              {/* Capacity and Interview Quotas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Years of Experience <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={formData.experienceYears}
                    onChange={(e) => {
                      setFormData({ ...formData, experienceYears: parseInt(e.target.value, 10) || 0 });
                      setFieldErrors({ ...fieldErrors, experienceYears: '' });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Weekly Capacity (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={formData.weeklyCapacityHours}
                    onChange={(e) => {
                      setFormData({ ...formData, weeklyCapacityHours: parseInt(e.target.value, 10) || 5 });
                      setFieldErrors({ ...fieldErrors, weeklyCapacityHours: '' });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[10px] text-slate-500">Max hours of interviews/week</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Daily Limit (Interviews)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.dailyInterviewLimit}
                    onChange={(e) => {
                      setFormData({ ...formData, dailyInterviewLimit: parseInt(e.target.value, 10) || 2 });
                      setFieldErrors({ ...fieldErrors, dailyInterviewLimit: '' });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[10px] text-slate-500">Burnout protection cap</span>
                </div>
              </div>

              {/* Interview Specializations */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Interview Specializations
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.interviewSpecializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(spec)}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSpecInput}
                    onChange={(e) => setNewSpecInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpec())}
                    placeholder="Add specialization (e.g. Architecture Deep-Dive, Live Coding, Culture Alignment)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN SPECIFIC FORM */}
          {role === 'ADMIN' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Job Title / Designation <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setFieldErrors({ ...fieldErrors, title: '' });
                    }}
                    placeholder="e.g. VP of People & Operations"
                    className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                      fieldErrors.title
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => {
                      setFormData({ ...formData, department: e.target.value });
                      setFieldErrors({ ...fieldErrors, department: '' });
                    }}
                    placeholder="e.g. HR & Executive Leadership"
                    className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                      fieldErrors.department
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.department && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.department}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATE SPECIFIC FORM */}
          {role === 'CANDIDATE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Current Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Current Company</label>
                  <input
                    type="text"
                    value={formData.currentCompany}
                    onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                    placeholder="e.g. Innovatech Labs"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Key Skills & Technologies <span className="text-rose-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add skill (e.g. React, Python, AWS) and press Enter"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Education / Degree</label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    placeholder="e.g. B.S. in Computer Science"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Resume Document URL</label>
                  <input
                    type="url"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Professional Bio (Common) */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                Professional Bio & Executive Summary
              </label>
              <span className="text-[10px] text-slate-500">
                {(formData.bio || '').length} / 1000 characters
              </span>
            </div>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => {
                setFormData({ ...formData, bio: e.target.value });
                setFieldErrors({ ...fieldErrors, bio: '' });
              }}
              placeholder="Highlight key career achievements, recruitment methodologies, or architectural competencies..."
              className={`w-full bg-slate-800 border rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                fieldErrors.bio
                  ? 'border-rose-500 ring-1 ring-rose-500/50'
                  : 'border-slate-700 focus:border-blue-500'
              }`}
            />
            {fieldErrors.bio && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.bio}</p>
            )}
          </div>

          {/* Social / Professional Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => {
                  setFormData({ ...formData, linkedinUrl: e.target.value });
                  setFieldErrors({ ...fieldErrors, linkedinUrl: '' });
                }}
                placeholder="https://linkedin.com/in/username"
                className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                  fieldErrors.linkedinUrl
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
              />
              {fieldErrors.linkedinUrl && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.linkedinUrl}</p>
              )}
            </div>

            {role === 'CANDIDATE' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" /> Portfolio / GitHub URL
                </label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, portfolioUrl: e.target.value });
                    setFieldErrors({ ...fieldErrors, portfolioUrl: '' });
                  }}
                  placeholder="https://github.com/username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sticky Action Footer */}
        <div className="p-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Profile changes are immediately synchronized across evaluations and scheduling panels.</span>
          </div>

          <div className="flex items-center space-x-2">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
              >
                Discard
              </button>
            )}

            <button
              type="submit"
              disabled={saving || !isDirty}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-2 ${
                isDirty
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
