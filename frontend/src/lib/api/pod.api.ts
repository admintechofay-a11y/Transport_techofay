import { apiClient } from '../api-client';
import { PaginatedResponse } from '@/types/api.types';

export interface PodRecord {
  id: string;
  uuid?: string;
  public_id?: string;
  company_uuid?: string;
  order_uuid?: string;
  subject_uuid?: string;
  subject_type?: string;
  remarks?: string;
  data?: {
    receiver_name?: string;
    receiver_phone?: string;
    delivery_date?: string;
    packages_condition?: string;
    latitude?: number;
    longitude?: number;
    photo_url?: string;
    signature_url?: string;
    status?: string;
  };
  order?: {
    id: string;
    load_number?: string;
    status?: string;
    customer?: { name?: string };
    consignor?: { name?: string };
    consignee?: { name?: string };
    vehicle?: { plate_number?: string };
    driver?: { name?: string; phone?: string };
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreatePodPayload {
  order_uuid: string;
  receiver_name: string;
  receiver_phone?: string;
  delivery_date?: string;
  packages_condition?: string;
  latitude?: number;
  longitude?: number;
  file_url?: string;
  signature_url?: string;
  remarks?: string;
}

export const podApi = {
  list: async (filters: Record<string, any> = {}): Promise<PaginatedResponse<PodRecord>> => {
    const res = await apiClient.get<PaginatedResponse<PodRecord>>('/proofs', { params: filters });
    return res.data;
  },

  get: async (id: string): Promise<PodRecord> => {
    const res = await apiClient.get<{ proof: PodRecord } | PodRecord>(`/proofs/${id}`);
    return (res.data as any).proof || res.data;
  },

  create: async (data: CreatePodPayload): Promise<PodRecord> => {
    const res = await apiClient.post<{ proof: PodRecord } | PodRecord>('/proofs', data);
    return (res.data as any).proof || res.data;
  },

  getPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/proofs/${id}/pdf`;
  },
};
