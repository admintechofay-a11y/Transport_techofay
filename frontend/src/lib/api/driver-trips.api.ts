import { apiClient } from '../api-client';
import { PaginatedResponse } from '@/types/api.types';
import { Load, LoadLocation } from '@/types/load.types';

export interface DriverTrip extends Load {
  locations?: LoadLocation[];
}

export interface StopActionPayload {
  stop_id: string;
  remarks?: string;
  status?: string;
}

export interface CompleteTripPayload {
  odometer_end?: string;
  remarks?: string;
}

export const driverTripApi = {
  list: async (params: Record<string, any> = {}): Promise<PaginatedResponse<DriverTrip>> => {
    const res = await apiClient.get<PaginatedResponse<DriverTrip>>('/driver/trips', { params });
    return res.data;
  },

  get: async (id: string): Promise<DriverTrip> => {
    const res = await apiClient.get<{ trip: DriverTrip } | DriverTrip>(`/driver/trips/${id}`);
    return (res.data as any).trip || res.data;
  },

  accept: async (id: string): Promise<DriverTrip> => {
    const res = await apiClient.post<{ trip: DriverTrip } | DriverTrip>(`/driver/trips/${id}/accept`);
    return (res.data as any).trip || res.data;
  },

  start: async (id: string): Promise<DriverTrip> => {
    const res = await apiClient.post<{ trip: DriverTrip } | DriverTrip>(`/driver/trips/${id}/start`);
    return (res.data as any).trip || res.data;
  },

  startStop: async (tripId: string, payload: StopActionPayload): Promise<{ trip: DriverTrip; stop: LoadLocation }> => {
    const res = await apiClient.post<{ trip: DriverTrip; stop: LoadLocation }>(`/driver/trips/${tripId}/start-stop`, payload);
    return res.data;
  },

  completeStop: async (tripId: string, payload: StopActionPayload): Promise<{ trip: DriverTrip; stop: LoadLocation }> => {
    const res = await apiClient.post<{ trip: DriverTrip; stop: LoadLocation }>(`/driver/trips/${tripId}/complete-stop`, payload);
    return res.data;
  },

  complete: async (id: string, payload?: CompleteTripPayload): Promise<DriverTrip> => {
    const res = await apiClient.post<{ trip: DriverTrip } | DriverTrip>(`/driver/trips/${id}/complete`, payload || {});
    return (res.data as any).trip || res.data;
  },
};
