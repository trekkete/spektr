import { VendorConfiguration, VendorConfigurationRequest } from '../types/vendor';

const API_BASE_URL = '/api/vendors';

export const vendorService = {
  async getMyVendors(): Promise<VendorConfiguration[]> {
    const response = await fetch(`${API_BASE_URL}/my`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }

    return response.json();
  },

  async getSharedVendors(): Promise<VendorConfiguration[]> {
    const response = await fetch(`${API_BASE_URL}/shared`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch shared vendors');
    }

    return response.json();
  },

  async getAllVendors(): Promise<VendorConfiguration[]> {
    const response = await fetch(`${API_BASE_URL}/all`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }

    return response.json();
  },

  async getVendor(id: number): Promise<VendorConfiguration> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor');
    }

    return response.json();
  },

  async getVersionHistory(vendorName: string): Promise<VendorConfiguration[]> {
    const response = await fetch(`${API_BASE_URL}/history/${encodeURIComponent(vendorName)}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch version history');
    }

    return response.json();
  },

  async createVendor(request: VendorConfigurationRequest): Promise<VendorConfiguration> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create vendor');
    }

    return response.json();
  },

  async deleteVendor(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete vendor');
    }
  },

  async shareVendor(configurationId: number, usernames: string[]): Promise<VendorConfiguration> {
    const response = await fetch(`${API_BASE_URL}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ configurationId, usernames }),
    });

    if (!response.ok) {
      throw new Error('Failed to share vendor');
    }

    return response.json();
  },
};
