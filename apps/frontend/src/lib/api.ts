// API client for Flag Stock Marketplace

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Handle token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              const { accessToken } = response.data;
              localStorage.setItem('accessToken', accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, fullName?: string) {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout(refreshToken: string) {
    await this.client.post('/auth/logout', { refreshToken });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Asset endpoints
  async searchAssets(filters: {
    asset_type?: string[];
    category_id?: string;
    tags?: string[];
    country_code?: string;
    is_premium?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest' | 'popular' | 'title';
  }) {
    const params = new URLSearchParams();
    if (filters.asset_type) {
      filters.asset_type.forEach((type) => params.append('asset_type', type));
    }
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.tags) {
      filters.tags.forEach((tag) => params.append('tags', tag));
    }
    if (filters.country_code) params.append('country_code', filters.country_code);
    if (filters.is_premium !== undefined) params.append('is_premium', String(filters.is_premium));
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sort) params.append('sort', filters.sort);

    const response = await this.client.get(`/assets?${params.toString()}`);
    return response.data;
  }

  async getAsset(id: string) {
    const response = await this.client.get(`/assets/${id}`);
    return response.data;
  }

  async getAssetBySlug(slug: string) {
    const response = await this.client.get(`/assets/slug/${slug}`);
    return response.data;
  }

  async getDownloadUrl(id: string, formatId?: string) {
    const params = formatId ? `?format_id=${formatId}` : '';
    const response = await this.client.get(`/assets/${id}/download${params}`);
    return response.data;
  }

  // Subscription endpoints
  async getPlans() {
    const response = await this.client.get('/subscriptions/plans');
    return response.data;
  }

  async getMySubscription() {
    const response = await this.client.get('/subscriptions/my-subscription');
    return response.data;
  }

  async checkPremium() {
    const response = await this.client.get('/subscriptions/check-premium');
    return response.data;
  }
}

export const api = new ApiClient();
