import { apiClient } from '../api-client';
import { FreightCharge, CustomerStatementData } from '@/types/freight.types';
import { PaginatedResponse } from '@/types/api.types';

export const freightApi = {
  list: async (params: any = {}): Promise<PaginatedResponse<FreightCharge>> => {
    const res = await apiClient.get('/freight-charges', { params });
    return res.data;
  },

  get: async (id: string): Promise<FreightCharge> => {
    const res = await apiClient.get(`/freight-charges/${id}`);
    return res.data;
  },

  create: async (data: Partial<FreightCharge>): Promise<FreightCharge> => {
    const res = await apiClient.post('/freight-charges', data);
    return res.data;
  },

  update: async (id: string, data: Partial<FreightCharge>): Promise<FreightCharge> => {
    const res = await apiClient.put(`/freight-charges/${id}`, data);
    return res.data;
  },

  customerStatement: async (customerUuid: string, fromDate?: string, toDate?: string): Promise<CustomerStatementData> => {
    const res = await apiClient.get(`/customers/${customerUuid}/statement`, {
      params: { from_date: fromDate, to_date: toDate },
    });
    return res.data;
  },

  getStatementPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/freight-charges/${id}/statement-pdf`;
  },

  getInvoicePdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/freight-charges/${id}/invoice-pdf`;
  },

  recordPayment: async (
    id: string,
    payload: { amount: number; payment_method?: string; reference?: string; notes?: string }
  ): Promise<{ freight_charge: FreightCharge; message: string }> => {
    const res = await apiClient.post(`/freight-charges/${id}/record-payment`, payload);
    return res.data;
  },
};

