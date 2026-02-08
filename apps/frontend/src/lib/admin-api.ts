// Admin API Helper
// Centralized API calls for admin panel

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export const adminApi = {
  // Dashboard
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Assets
  async getAssets(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await fetch(`${API_BASE_URL}/admin/assets?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch assets');
    return response.json();
  },

  async getAsset(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/assets/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch asset');
    return response.json();
  },

  async uploadAssets(formData: FormData) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const response = await fetch(`${API_BASE_URL}/admin/assets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    return response.json();
  },

  async updateAsset(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/admin/assets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }
    return response.json();
  },

  async toggleAssetStatus(id: string, enabled: boolean) {
    const response = await fetch(`${API_BASE_URL}/admin/assets/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) throw new Error('Failed to toggle status');
    return response.json();
  },

  async deleteAsset(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/assets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete asset');
    return response.json();
  },

  async getAssetStats(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/assets/${id}/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Categories & Tags
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async getTags() {
    const response = await fetch(`${API_BASE_URL}/admin/tags`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tags');
    return response.json();
  },

  // Subscriptions
  async getSubscriptions() {
    const response = await fetch(`${API_BASE_URL}/admin/subscriptions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return response.json();
  },

  // Countries
  async getCountries(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await fetch(`${API_BASE_URL}/admin/countries?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch countries');
    }
    return response.json();
  },

  async getCountry(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/countries/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch country');
    }
    return response.json();
  },

  async createCountry(data: any) {
    const response = await fetch(`${API_BASE_URL}/admin/countries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create country');
    }
    return response.json();
  },

  async updateCountry(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/admin/countries/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update country');
    }
    return response.json();
  },

  async deleteCountry(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/countries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete country');
    }
    return response.json();
  },

  async restoreCountry(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/countries/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to restore country');
    }
    return response.json();
  },

  // Country Flag Files
  async getCountryFlags(countryId: string, filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await fetch(`${API_BASE_URL}/admin/countries/${countryId}/flags?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch flag files');
    }
    return response.json();
  },

  async uploadFlagFile(countryId: string, formData: FormData) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const response = await fetch(`${API_BASE_URL}/admin/countries/${countryId}/flags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    return response.json();
  },

  async updateFlagFile(flagId: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/admin/countries/flags/${flagId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update flag file');
    }
    return response.json();
  },

  async deleteFlagFile(flagId: string) {
    const response = await fetch(`${API_BASE_URL}/admin/countries/flags/${flagId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete flag file');
    }
    return response.json();
  },
};
