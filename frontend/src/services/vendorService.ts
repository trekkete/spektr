import { VendorConfiguration, VendorConfigurationRequest } from '../types/vendor';
import { fetchWithAuth } from '../utils/fetchWithAuth';

const API_BASE_URL = '/api/vendors';

export interface EnumMaskValue {
  name: string;
  flag: number;
}

export const vendorService = {
  async getMyVendors(): Promise<VendorConfiguration[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/my`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetchWithAuth vendors');
    }

    return response.json();
  },

  async getSharedVendors(): Promise<VendorConfiguration[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/shared`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetchWithAuth shared vendors');
    }

    return response.json();
  },

  async getAllVendors(): Promise<VendorConfiguration[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/all`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetchWithAuth vendors');
    }

    return response.json();
  },

  async getVendor(id: number): Promise<VendorConfiguration> {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetchWithAuth vendor');
    }

    return response.json();
  },

  async getVersionHistory(vendorName: string): Promise<VendorConfiguration[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/history/${encodeURIComponent(vendorName)}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetchWithAuth version history');
    }

    return response.json();
  },

  async createVendor(request: VendorConfigurationRequest): Promise<VendorConfiguration> {
    const response = await fetchWithAuth(API_BASE_URL, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete vendor');
    }
  },

  async shareVendor(configurationId: number, usernames: string[]): Promise<VendorConfiguration> {
    const response = await fetchWithAuth(`${API_BASE_URL}/share`, {
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

  async exportToPdf(id: number): Promise<Blob> {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}/pdf`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }

    return response.blob();
  },

  async getRoamingBehaviourValues(): Promise<string[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/enums/roaming-behaviour`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch roaming behaviour values');
    }

    return response.json();
  },

  async getPasswordAuthenticationMaskValues(): Promise<EnumMaskValue[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/enums/password-authentication-mask`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch password authentication mask values');
    }

    return response.json();
  },

  async getWalledGardenMaskValues(): Promise<EnumMaskValue[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/enums/walled-garden-mask`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch walled garden mask values');
    }

    return response.json();
  },

  async getRadiusAttributesValues(): Promise<EnumMaskValue[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/enums/radius-attributes-mask`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch radius attributes mask values');
    }

    return response.json();
  },
};
