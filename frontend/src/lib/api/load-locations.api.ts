import { apiClient } from '../api-client';
import { PaginatedResponse } from '@/types/api.types';

export interface LoadLocation {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  company_uuid?: string;
  load_uuid?: string;
  sequence?: number;
  location_type?: 'pickup' | 'delivery' | string;
  contact_name?: string;
  contact_phone?: string;
  material_items?: any[];
  total_quantity?: number;
  total_weight?: number;
  status: 'pending' | 'arrived' | 'loading' | 'loaded' | 'in_transit' | 'delivered' | 'skipped' | string;
  completed_at?: string;
  completed_by_uuid?: string;
  remarks?: string;
}

export const loadLocationsApi = {
  list: async (params: any = {}): Promise<PaginatedResponse<LoadLocation>> => {
    const res = await apiClient.get('/load-locations', { params });
    return res.data;
  },

  get: async (id: string): Promise<LoadLocation> => {
    const res = await apiClient.get(`/load-locations/${id}`);
    return res.data;
  },

  create: async (data: Partial<LoadLocation>): Promise<LoadLocation> => {
    const res = await apiClient.post('/load-locations', data);
    return res.data;
  },

  update: async (id: string, data: Partial<LoadLocation>): Promise<LoadLocation> => {
    const res = await apiClient.put(`/load-locations/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string, remarks?: string): Promise<LoadLocation> => {
    const res = await apiClient.patch(`/load-locations/${id}/status`, { status, remarks });
    return res.data;
  },

  complete: async (id: string, remarks?: string): Promise<LoadLocation> => {
    const res = await apiClient.post(`/load-locations/${id}/complete`, { remarks });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/load-locations/${id}`);
  },
};
