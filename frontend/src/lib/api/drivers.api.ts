import { apiClient } from '../api-client';
import { Driver, DriverDocument } from '@/types/driver.types';
import { PaginatedResponse } from '@/types/api.types';

export const driverApi = {
  list: async (params: any = {}): Promise<any> => {
    const res = await apiClient.get('/drivers', { params });
    const list = res.data?.drivers || res.data?.data || res.data;
    if (Array.isArray(list)) {
      (list as any).drivers = list;
      (list as any).data = list;
      return list;
    }
    return res.data;
  },

  get: async (id: string): Promise<Driver> => {
    const res = await apiClient.get(`/drivers/${id}`);
    return res.data?.driver || res.data?.data || res.data;
  },

  create: async (data: Partial<Driver>): Promise<Driver> => {
    const driverData = {
      ...data,
      drivers_license_number: (data as any).driving_licence_number || (data as any).drivers_license_number,
      driving_licence_number: (data as any).driving_licence_number || (data as any).drivers_license_number,
    };
    const payload = (data as any).driver ? data : { driver: driverData };
    const res = await apiClient.post('/drivers', payload);
    return res.data?.driver || res.data?.data || res.data;
  },

  update: async (id: string, data: Partial<Driver>): Promise<Driver> => {
    const driverData = {
      ...data,
      drivers_license_number: (data as any).driving_licence_number || (data as any).drivers_license_number,
      driving_licence_number: (data as any).driving_licence_number || (data as any).drivers_license_number,
    };
    const payload = (data as any).driver ? data : { driver: driverData };
    const res = await apiClient.put(`/drivers/${id}`, payload);
    return res.data?.driver || res.data?.data || res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/drivers/${id}`);
  },

  getExpiringDocuments: async (days: number = 30): Promise<any> => {
    const res = await apiClient.get('/driver-documents/expiring', { params: { days } });
    return res.data;
  },

  addDocument: async (data: Partial<DriverDocument>): Promise<DriverDocument> => {
    const res = await apiClient.post('/driver-documents', data);
    return res.data;
  },

  getDocumentDownloadUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/driver-documents/${id}/download`;
  },
};
