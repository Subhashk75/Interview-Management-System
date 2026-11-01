import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Building, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'LOGIN' | 'SIGNUP' | 'VERIFY_OTP';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'LOGIN',
}) => {
  const { login, register, verifyOtp, resendOtp } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'VERIFY_OTP'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resending, setResending] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result && result.requireOtp) {
        setSuccessMessage('Please enter the 6-digit OTP verification code sent to your email.');
        setMode('VERIFY_OTP');
      } else {
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Login failed';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await register({
        firstName,
        lastName,
        email,
        password,
        organizationName,
      });

      if (res.requireOtp) {
        setSuccessMessage(`A 6-digit verification code has been dispatched to ${email}.`);
        setMode('VERIFY_OTP');
      } else {
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Registration failed';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await verifyOtp(email, otpCode);
      setSuccessMessage('Email verified successfully! Welcome aboard.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Invalid or expired OTP';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setErrorMessage('Please provide your email address to resend OTP.');
      return;
    }

    setResending(true);
    setErrorMessage(null);
    try {
      await resendOtp(email);
      setSuccessMessage('A fresh 6-digit OTP code has been dispatched to your email.');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'LOGIN' && 'Sign In to Interview Portal'}
                {mode === 'SIGNUP' && 'Create Your Account'}
                {mode === 'VERIFY_OTP' && 'Verify Your Email with OTP'}
              </h2>
              <p className="text-xs text-slate-400">Enterprise recruitment authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers if not in OTP mode */}
        {mode !== 'VERIFY_OTP' && (
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition text-center border-b-2 ${
                mode === 'LOGIN'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('SIGNUP');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition text-center border-b-2 ${
                mode === 'SIGNUP'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              {/* Quick Demo Credentials */}
              <div className="pt-3 border-t border-slate-800">
                <p className="text-[11px] font-medium text-slate-400 mb-2">
                  Quick Demo Logins (Password: <code className="text-blue-400 font-mono">Password123!</code>):
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('recruiter@acme.com');
                      setPassword('Password123!');
                    }}
                    className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-700/60 transition"
                  >
                    Recruiter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@acme.com');
                      setPassword('Password123!');
                    }}
                    className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-700/60 transition"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('emily.zhang@example.com');
                      setPassword('Password123!');
                    }}
                    className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-700/60 transition"
                  >
                    Candidate
                  </button>
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGNUP');
                    setErrorMessage(null);
                  }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Sign Up with Email OTP
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'SIGNUP' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Sarah"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Connor"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@company.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Global Inc."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Continue to Email OTP Verification'}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setErrorMessage(null);
                  }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* OTP VERIFICATION FORM */}
          {mode === 'VERIFY_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-300">
                  We've sent a 6-digit confirmation code to:
                </p>
                <p className="text-xs font-mono font-bold text-blue-400">{email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-48 bg-slate-800 border-2 border-blue-500/60 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.4em] text-white focus:outline-none focus:border-blue-400 shadow-inner"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Code is valid for 10 minutes. Check your inbox or spam folder.
                </p>
                <div className="text-center mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res: any = await (await import('../services/api.ts')).default.get('/auth/email-logs');
                        const logs = res.data || [];
                        const match = logs.find((l: any) => l.to?.toLowerCase() === email.toLowerCase() && l.otp);
                        if (match?.otp) {
                          setOtpCode(match.otp);
                          setSuccessMessage(`Loaded recent code: ${match.otp}`);
                        } else {
                          setErrorMessage('No recent verification code found in server logs. Click "Resend Code".');
                        }
                      } catch {
                        setErrorMessage('Could not retrieve code from server log.');
                      }
                    }}
                    className="text-[10px] text-slate-500 hover:text-blue-400 underline transition"
                  >
                    View / Auto-fill latest code from server log
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setErrorMessage(null);
                  }}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ← Back to Login
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-blue-400 hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
