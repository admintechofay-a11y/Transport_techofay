import { apiClient } from '../api-client';

export interface TelemetryPayload {
  device_token?: string;
  device_id?: string;
  vehicle_uuid?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  odometer?: number;
  timestamp?: string;
}

export interface TelemetryIngestResponse {
  success: boolean;
  position_uuid: string;
  company_uuid: string;
  vehicle_uuid?: string;
  device_uuid?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  timestamp: string;
}

export interface TelemetryPositionRecord {
  id: string;
  uuid?: string;
  company_uuid?: string;
  subject_uuid?: string;
  subject_type?: string;
  latitude?: number;
  longitude?: number;
  speed?: string | number;
  heading?: string | number;
  bearing?: string | number;
  altitude?: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface BatchTelemetryResponse {
  success: boolean;
  count: number;
  items: TelemetryIngestResponse[];
}

export const telemetryApi = {
  ingest: async (data: TelemetryPayload): Promise<TelemetryIngestResponse> => {
    const res = await apiClient.post<TelemetryIngestResponse>('/telemetry', data);
    return res.data;
  },

  batchIngest: async (positions: TelemetryPayload[]): Promise<BatchTelemetryResponse> => {
    const res = await apiClient.post<BatchTelemetryResponse>('/telemetry', { positions });
    return res.data;
  },

  latest: async (params: { vehicle_uuid?: string; order_uuid?: string; limit?: number } = {}): Promise<TelemetryPositionRecord[]> => {
    const res = await apiClient.get<{ data?: TelemetryPositionRecord[]; positions?: TelemetryPositionRecord[] }>('/telemetry/latest', { params });
    return res.data.positions || res.data.data || [];
  },
};
