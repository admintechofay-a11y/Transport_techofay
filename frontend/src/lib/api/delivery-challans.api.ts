import { apiClient } from '../api-client';
import { DeliveryChallan, GatePass } from '@/types/delivery-challan.types';
import { PaginatedResponse } from '@/types/api.types';

export const challanApi = {
  list: async (params: any = {}): Promise<PaginatedResponse<DeliveryChallan>> => {
    const res = await apiClient.get('/delivery-challans', { params });
    return res.data;
  },

  get: async (id: string): Promise<DeliveryChallan> => {
    const res = await apiClient.get(`/delivery-challans/${id}`);
    return res.data;
  },

  create: async (data: Partial<DeliveryChallan>): Promise<DeliveryChallan> => {
    const res = await apiClient.post('/delivery-challans', data);
    return res.data;
  },

  update: async (id: string, data: Partial<DeliveryChallan>): Promise<DeliveryChallan> => {
    const res = await apiClient.put(`/delivery-challans/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string, extra: any = {}): Promise<DeliveryChallan> => {
    const res = await apiClient.patch(`/delivery-challans/${id}/status`, { status, ...extra });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/delivery-challans/${id}`);
  },

  getPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/delivery-challans/${id}/pdf`;
  },

  shareWhatsApp: async (id: string, phone?: string): Promise<any> => {
    const res = await apiClient.post(`/delivery-challans/${id}/whatsapp`, { phone });
    return res.data;
  },
};

export const gatePassApi = {
  list: async (params: any = {}): Promise<PaginatedResponse<GatePass>> => {
    const res = await apiClient.get('/gate-passes', { params });
    return res.data;
  },

  get: async (id: string): Promise<GatePass> => {
    const res = await apiClient.get(`/gate-passes/${id}`);
    return res.data;
  },

  create: async (data: Partial<GatePass>): Promise<GatePass> => {
    const res = await apiClient.post('/gate-passes', data);
    return res.data;
  },

  recordExit: async (id: string): Promise<GatePass> => {
    const res = await apiClient.post(`/gate-passes/${id}/exit`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/gate-passes/${id}`);
  },

  getPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/gate-passes/${id}/pdf`;
  },
};
