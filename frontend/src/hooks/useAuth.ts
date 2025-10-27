// Authentication hook using Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api';
import { User, AuthState } from '@/types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await apiClient.login({ username, password });

          if (response.success && response.data) {
            const { user, token } = response.data;

            // Store token in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', token);
            }

            set({
              user,
              token,
              isAuthenticated: true,
            });

            // Return user data for redirect logic
            return user;
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: () => {
        try {
          // Clear token from localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }

          // Call logout API
          apiClient.logout().catch(console.error);

          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook for getting current user
export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout, setUser } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    setUser,
  };
};