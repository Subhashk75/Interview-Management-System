import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';
import { User } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  mustChangePassword: boolean;
  login: (email: string, password?: string) => Promise<{ requireOtp?: boolean; email?: string; requirePasswordChange?: boolean } | void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName?: string;
  }) => Promise<{ requireOtp: boolean; email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: 'ADMIN' | 'RECRUITER' | 'HR' | 'INTERVIEWER' | 'HIRING_MANAGER' | 'MANAGER' | 'CANDIDATE') => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<any>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res: any = await api.get('/auth/me');
          setUser(res.data);
          setMustChangePassword(Boolean(res.data?.mustChangePassword));
        } catch (err) {
          console.warn('Session restoration failed, re-initializing dev session:', err);
          localStorage.removeItem('token');
          setToken(null);
          await switchDemoRole('RECRUITER');
        }
      } else {
        // Auto-login as default Recruiter in development for initial seamless demo
        await switchDemoRole('RECRUITER');
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    try {
      const res: any = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData, requirePasswordChange } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      const needsChange = Boolean(requirePasswordChange || userData?.mustChangePassword);
      setMustChangePassword(needsChange);
      return { requirePasswordChange: needsChange };
    } catch (err: any) {
      const isUnverified =
        (err.response?.status === 403 && err.response?.data?.data?.requireOtp) ||
        (err.status === 403 && (err.data?.data?.requireOtp || err.code === 'ACCOUNT_NOT_VERIFIED'));
      if (isUnverified) {
        return {
          requireOtp: true,
          email: err.response?.data?.data?.email || err.data?.data?.email || email,
        };
      }
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res: any = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
    }
    setMustChangePassword(false);
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName?: string;
  }) => {
    const res: any = await api.post('/auth/register', data);
    const payload = res.data || res;
    if (payload?.token) {
      localStorage.setItem('token', payload.token);
      setToken(payload.token);
      setUser(payload.user);
      setMustChangePassword(false);
    }
    return {
      requireOtp: Boolean(payload?.requireOtp),
      email: payload?.email || data.email,
    };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res: any = await api.post('/auth/verify-otp', { email, otp });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const resendOtp = async (email: string) => {
    await api.post('/auth/resend-otp', { email });
  };

  const refreshUser = async () => {
    try {
      const res: any = await api.get('/profile/me');
      if (res.data?.user) {
        setUser(res.data.user);
      } else if (res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    const res: any = await api.put('/profile/me', data);
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: 'ADMIN' | 'RECRUITER' | 'HR' | 'INTERVIEWER' | 'HIRING_MANAGER' | 'MANAGER' | 'CANDIDATE') => {
    setLoading(true);
    try {
      const emailMap: Record<string, string> = {
        ADMIN: 'admin@acme.com',
        RECRUITER: 'recruiter@acme.com',
        HR: 'recruiter@acme.com',
        INTERVIEWER: 'david.kim@acme.com',
        HIRING_MANAGER: 'marcus.vance@acme.com',
        MANAGER: 'marcus.vance@acme.com',
        CANDIDATE: 'emily.zhang@example.com',
      };
      await login(emailMap[role], 'Password123!');
    } catch (err) {
      console.warn('Auto demo login warning:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        mustChangePassword,
        login,
        register,
        verifyOtp,
        resendOtp,
        changePassword,
        logout,
        switchDemoRole,
        updateUserProfile,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
