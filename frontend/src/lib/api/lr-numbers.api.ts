import { apiClient } from '../api-client';
import { LrNumber, LrStatusHistory } from '@/types/lr-number.types';
import { PaginatedResponse } from '@/types/api.types';

export const lrApi = {
  list: async (params: any = {}): Promise<PaginatedResponse<LrNumber>> => {
    const res = await apiClient.get('/lr-numbers', { params });
    return res.data;
  },

  get: async (id: string): Promise<LrNumber> => {
    const res = await apiClient.get(`/lr-numbers/${id}`);
    return res.data;
  },

  create: async (data: Partial<LrNumber>): Promise<LrNumber> => {
    const res = await apiClient.post('/lr-numbers', data);
    return res.data;
  },

  update: async (id: string, data: Partial<LrNumber>): Promise<LrNumber> => {
    const res = await apiClient.put(`/lr-numbers/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string, notes?: string, location?: string, force: boolean = false): Promise<any> => {
    const res = await apiClient.post(`/lr-numbers/${id}/status`, { status, notes, location, force });
    return res.data;
  },

  history: async (id: string): Promise<{ lr_number: string; history: LrStatusHistory[] }> => {
    const res = await apiClient.get(`/lr-numbers/${id}/history`);
    return res.data;
  },

  shareWhatsApp: async (id: string, phone?: string): Promise<any> => {
    const res = await apiClient.post(`/lr-numbers/${id}/whatsapp`, { phone });
    return res.data;
  },

  getPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/lr-numbers/${id}/pdf`;
  },
};
