import { apiClient } from '../api-client';
import { PaginatedResponse } from '@/types/api.types';

export interface AuditLogRecord {
  id: string;
  uuid?: string;
  public_id?: string;
  company_uuid?: string;
  user_uuid?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | string;
  entity_type: string;
  entity_uuid?: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  entity_uuid?: string;
  user_uuid?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const auditLogsApi = {
  list: async (filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLogRecord>> => {
    const res = await apiClient.get<PaginatedResponse<AuditLogRecord>>('/audit-logs', { params: filters });
    return res.data;
  },

  get: async (id: string): Promise<AuditLogRecord> => {
    const res = await apiClient.get<{ audit_log?: AuditLogRecord; data?: AuditLogRecord } | AuditLogRecord>(`/audit-logs/${id}`);
    const data = res.data as any;
    return data.audit_log || data.data || data;
  },
};
