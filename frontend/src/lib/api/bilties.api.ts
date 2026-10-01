import { apiClient } from '../api-client';
import { Bilty } from '@/types/bilty.types';
import { PaginatedResponse } from '@/types/api.types';

export const biltyApi = {
  list: async (params: any = {}): Promise<PaginatedResponse<Bilty>> => {
    const res = await apiClient.get('/bilties', { params });
    return res.data;
  },

  get: async (id: string): Promise<Bilty> => {
    const res = await apiClient.get(`/bilties/${id}`);
    return res.data;
  },

  create: async (data: Partial<Bilty>): Promise<Bilty> => {
    const res = await apiClient.post('/bilties', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Bilty>): Promise<Bilty> => {
    const res = await apiClient.put(`/bilties/${id}`, data);
    return res.data;
  },

  shareWhatsApp: async (id: string, phone?: string): Promise<any> => {
    const res = await apiClient.post(`/bilties/${id}/whatsapp`, { phone });
    return res.data;
  },

  getPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/bilties/${id}/pdf`;
  },
};
