import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor - add token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - remove and redirect
      try {
        await SecureStore.deleteItemAsync('accessToken');
      } catch (e) {
        // Ignore
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; phone?: string; address?: string }) =>
    api.patch('/auth/profile', data),
};

// Listings functions
export const listingsApi = {
  search: (params: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => api.get('/listings', { params }),
  getById: (id: string) => api.get(`/listings/${id}`),
  getCalendar: (id: string, month?: string) =>
    api.get(`/listings/${id}/calendar`, { params: { month } }),
  create: (data: any) => api.post('/listings', data),
  update: (id: string, data: any) => api.put(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
};

// Bookings functions
export const bookingsApi = {
  create: (data: {
    listingId: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    specialRequests?: string;
  }) => api.post('/bookings', data),
  getMy: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string, reason?: string) => api.post(`/bookings/${id}/cancel`, { reason }),
};

// Host functions
export const hostApi = {
  getDashboard: () => api.get('/host/dashboard'),
  getListings: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/host/listings', { params }),
  getBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/host/bookings', { params }),
  apply: (data: { businessName: string; businessLicense?: string }) =>
    api.post('/host/apply', data),
};

// Chat functions
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (bookingId: string, since?: string) =>
    api.get(`/chat/${bookingId}`, { params: { since } }),
  sendMessage: (bookingId: string, message: string) =>
    api.post(`/chat/${bookingId}`, { message }),
  markAsRead: (bookingId: string) => api.post(`/chat/${bookingId}/read`),
};

// Admin functions
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: { page?: number; limit?: number; role?: string }) =>
    api.get('/admin/users', { params }),
  getListings: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/listings', { params }),
  getBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/bookings', { params }),
  updateUserStatus: (userId: string, status: string) =>
    api.patch(`/admin/users/${userId}/status`, { status }),
  updateListingStatus: (listingId: string, status: string) =>
    api.patch(`/admin/listings/${listingId}/status`, { status }),
};
