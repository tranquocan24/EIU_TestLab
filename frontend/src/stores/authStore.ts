import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '@/types';
import api from '@/lib/api';

const STORAGE_VERSION = '2.0'; // Increment this when making breaking changes

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await api.login({ username, password });
          const { user, token } = response.data!;

          // Store token in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('storage-version', STORAGE_VERSION);

          set({
            user,
            token,
            isAuthenticated: true,
          });

          return user;
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('storage-version');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      version: 2, // Increment this to invalidate old storage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persistedState: unknown, version: number) => {
        // Clear old state if version mismatch
        if (version < 2) {
          localStorage.removeItem('token');
          localStorage.removeItem('storage-version');
          return {
            user: null,
            token: null,
            isAuthenticated: false,
            login: async () => { throw new Error('Not implemented'); },
            logout: () => { },
            setUser: () => { },
          };
        }
        return persistedState as AuthState;
      },
    }
  )
);