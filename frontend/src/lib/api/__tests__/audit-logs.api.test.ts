import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditLogsApi } from '../audit-logs.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('auditLogsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches audit logs with filtering parameters', async () => {
    const mockResponse = {
      data: [
        {
          id: 'audit-1',
          action: 'STATUS_CHANGE',
          entity_type: 'LrNumber',
          entity_uuid: 'lr-123',
          before: { status: 'booked' },
          after: { status: 'in_transit' },
        },
      ],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 1,
      },
    };

    (apiClient.get as any).mockResolvedValueOnce({ data: mockResponse });

    const result = await auditLogsApi.list({ action: 'STATUS_CHANGE', entity_type: 'LrNumber' });

    expect(apiClient.get).toHaveBeenCalledWith('/audit-logs', {
      params: { action: 'STATUS_CHANGE', entity_type: 'LrNumber' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].action).toBe('STATUS_CHANGE');
    expect(result.data[0].entity_type).toBe('LrNumber');
  });

  it('fetches a single audit log entry by ID', async () => {
    const mockLog = {
      id: 'audit-1',
      action: 'CREATE',
      entity_type: 'Bilty',
      entity_uuid: 'bilty-999',
      after: { bilty_number: 'BL-2026-0001' },
    };

    (apiClient.get as any).mockResolvedValueOnce({ data: { audit_log: mockLog } });

    const result = await auditLogsApi.get('audit-1');

    expect(apiClient.get).toHaveBeenCalledWith('/audit-logs/audit-1');
    expect(result.id).toBe('audit-1');
    expect(result.action).toBe('CREATE');
    expect(result.entity_type).toBe('Bilty');
  });
});
