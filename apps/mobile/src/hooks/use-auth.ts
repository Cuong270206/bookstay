import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      const { accessToken, user } = res.data;

      // Save token
      await SecureStore.setItemAsync('accessToken', accessToken);

      set({ user, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  },

  register: async (data) => {
    try {
      const res = await authApi.register(data);
      const { accessToken, user } = res.data;

      // Save token
      await SecureStore.setItemAsync('accessToken', accessToken);

      set({ user, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
    } catch (error) {
      // Ignore
    }
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const res = await authApi.getMe();
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
