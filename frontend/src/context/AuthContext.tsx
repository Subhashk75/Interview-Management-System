import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';
import { User } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password?: string) => Promise<void>;
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
        // Auto-login as default Recruiter in development for seamless demo
        await switchDemoRole('RECRUITER');
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    const res: any = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
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
    <AuthContext.Provider value={{ user, token, login, logout, switchDemoRole, loading }}>
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
