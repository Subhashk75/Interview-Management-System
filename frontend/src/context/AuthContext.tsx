import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';
import { User } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password?: string) => Promise<{ requireOtp?: boolean; email?: string } | void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName?: string;
  }) => Promise<{ requireOtp: boolean; email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: 'ADMIN' | 'RECRUITER' | 'INTERVIEWER') => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res: any = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Session restoration failed:', err);
          logout();
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
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.data?.requireOtp) {
        return {
          requireOtp: true,
          email: err.response.data.data.email || email,
        };
      }
      throw err;
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName?: string;
  }) => {
    const res: any = await api.post('/auth/register', data);
    return {
      requireOtp: true,
      email: res.data?.email || data.email,
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

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: 'ADMIN' | 'RECRUITER' | 'INTERVIEWER') => {
    setLoading(true);
    try {
      const emailMap = {
        ADMIN: 'admin@acme.com',
        RECRUITER: 'recruiter@acme.com',
        INTERVIEWER: 'david.kim@acme.com',
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
      value={{ user, token, login, register, verifyOtp, resendOtp, logout, switchDemoRole, loading }}
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
