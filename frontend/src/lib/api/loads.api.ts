import { apiClient } from '../api-client';
import { Load, LoadFilters } from '@/types/load.types';
import { PaginatedResponse } from '@/types/api.types';

export const loadApi = {
  list: async (filters: LoadFilters = {}): Promise<PaginatedResponse<Load>> => {
    const res = await apiClient.get('/orders', { params: filters });
    return res.data;
  },

  get: async (id: string): Promise<Load> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },

  create: async (data: Partial<Load>): Promise<Load> => {
    const res = await apiClient.post('/orders', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Load>): Promise<Load> => {
    const res = await apiClient.put(`/orders/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<Load> => {
    const res = await apiClient.patch(`/orders/${id}/status`, { status });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },

  getLoadingSlipPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/orders/${id}/loading-slip-pdf`;
  },

  getTripSheetPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/orders/${id}/trip-sheet-pdf`;
  },
};
