import { create } from 'zustand';
import { api } from '../lib/api';

interface User {
  id: number;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('pixel_token'),
  isLoading: true,

  login: (token: string) => {
    localStorage.setItem('pixel_token', token);
    set({ token });
    useAuthStore.getState().checkAuth();
  },

  logout: () => {
    localStorage.removeItem('pixel_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('pixel_token');
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }

      const response = await api.get('/auth/me');
      set({ user: response.data });
    } catch (error) {
      console.error("Sessão inválida", error);
      localStorage.removeItem('pixel_token');
      set({ user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));