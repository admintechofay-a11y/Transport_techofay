import { apiClient } from '../api-client';
import { Vehicle, VehicleDocument } from '@/types/vehicle.types';
import { PaginatedResponse } from '@/types/api.types';

export const vehicleApi = {
  list: async (params: any = {}): Promise<any> => {
    const res = await apiClient.get('/vehicles', { params });
    const list = res.data?.vehicles || res.data?.data || res.data;
    if (Array.isArray(list)) {
      (list as any).vehicles = list;
      (list as any).data = list;
      return list;
    }
    return res.data;
  },

  get: async (id: string): Promise<Vehicle> => {
    const res = await apiClient.get(`/vehicles/${id}`);
    return res.data?.vehicle || res.data?.data || res.data;
  },

  create: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const payload = (data as any).vehicle ? data : { vehicle: data };
    const res = await apiClient.post('/vehicles', payload);
    return res.data?.vehicle || res.data?.data || res.data;
  },

  update: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const payload = (data as any).vehicle ? data : { vehicle: data };
    const res = await apiClient.put(`/vehicles/${id}`, payload);
    return res.data?.vehicle || res.data?.data || res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  },

  getExpiringDocuments: async (days: number = 30): Promise<any> => {
    const res = await apiClient.get('/vehicle-documents/expiring', { params: { days } });
    return res.data;
  },

  addDocument: async (data: Partial<VehicleDocument>): Promise<VehicleDocument> => {
    const res = await apiClient.post('/vehicle-documents', data);
    return res.data;
  },

  getDocumentDownloadUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/vehicle-documents/${id}/download`;
  },
};
