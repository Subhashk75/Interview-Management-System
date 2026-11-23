import { create } from "zustand";

export type UserRole =
  | "ROLE_ADMIN"
  | "ROLE_HR"
  | "ROLE_INTERVIEWER"
  | "ROLE_HIRING_MANAGER"
  | "ROLE_CANDIDATE";

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: UserRole;
  department?: string;
  requiresPasswordChange: boolean;
}

interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserSession, token: string) => void;
  logout: () => void;
  setPasswordChanged: () => void;
  initializeSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ims_access_token", token);
      localStorage.setItem("ims_user_session", JSON.stringify(user));
    }
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    void apiClient.post("/auth/logout").catch(() => undefined);
    if (typeof window !== "undefined") {
      localStorage.removeItem("ims_access_token");
      localStorage.removeItem("ims_user_session");
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setPasswordChanged: () => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, requiresPasswordChange: false };
      if (typeof window !== "undefined") {
        localStorage.setItem("ims_user_session", JSON.stringify(updated));
      }
      return { user: updated };
    });
  },

  initializeSession: () => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("ims_access_token");
        const rawUser = localStorage.getItem("ims_user_session");
        if (token && rawUser) {
          const user = JSON.parse(rawUser);
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      } catch (err) {
        console.error("Session initialization failed", err);
      }
    }
    set({ isLoading: false });
  },
}));
import apiClient from "@/lib/api-client";

