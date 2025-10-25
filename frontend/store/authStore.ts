import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor';
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  profile_image?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const response = await api.post('/api/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ 
        user, 
        token: access_token, 
        isAuthenticated: true, 
        loading: false 
      });
    } catch (error: any) {
      set({ loading: false });
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (userData: any) => {
    try {
      set({ loading: true });
      const response = await api.post('/api/auth/register', userData);
      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ 
        user, 
        token: access_token, 
        isAuthenticated: true, 
        loading: false 
      });
    } catch (error: any) {
      set({ loading: false });
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  },

  updateUser: (user: User) => {
    set({ user });
    AsyncStorage.setItem('user', JSON.stringify(user));
  },
}));
