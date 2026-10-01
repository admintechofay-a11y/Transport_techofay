import { apiClient } from '../api-client';
import { PaginatedResponse } from '@/types/api.types';
import { CustomerParty, CustomerFilters } from '@/types/customer.types';

export const customerApi = {
  list: async (params: CustomerFilters = {}): Promise<PaginatedResponse<CustomerParty>> => {
    const res = await apiClient.get<PaginatedResponse<CustomerParty>>('/contacts', { params });
    return res.data;
  },

  get: async (id: string): Promise<CustomerParty> => {
    const res = await apiClient.get<{ contact: CustomerParty } | CustomerParty>(`/contacts/${id}`);
    return (res.data as any).contact || res.data;
  },

  create: async (data: Partial<CustomerParty>): Promise<CustomerParty> => {
    const res = await apiClient.post<{ contact: CustomerParty } | CustomerParty>('/contacts', data);
    return (res.data as any).contact || res.data;
  },

  update: async (id: string, data: Partial<CustomerParty>): Promise<CustomerParty> => {
    const res = await apiClient.put<{ contact: CustomerParty } | CustomerParty>(`/contacts/${id}`, data);
    return (res.data as any).contact || res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },
};
