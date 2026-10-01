import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lrApi } from '../lr-numbers.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: 'http://localhost:8000/api/v1' },
  },
}));

describe('LR Numbers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /lr-numbers with parameters', async () => {
    const mockList = {
      data: [{ id: 1, lr_number: 'LR-2026-000001', status: 'BOOKED' }],
      meta: { total: 1 },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockList });

    const res = await lrApi.list({ status: 'BOOKED' });

    expect(apiClient.get).toHaveBeenCalledWith('/lr-numbers', { params: { status: 'BOOKED' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].lr_number).toBe('LR-2026-000001');
  });

  it('calls POST /lr-numbers to create atomic LR record on server', async () => {
    const payload = {
      from_location: 'Ahmedabad',
      to_location: 'Mumbai',
      remarks: 'Automated test LR',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 1, lr_number: 'LR-2026-000001', status: 'BOOKED' },
    });

    const res = await lrApi.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/lr-numbers', payload);
    expect(res.lr_number).toBe('LR-2026-000001');
  });

  it('calls POST /lr-numbers/:id/status to trigger state transition', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { lr_number: { id: 1, status: 'LOADED' }, message: 'Success' },
    });

    const res = await lrApi.updateStatus('lr_123', 'LOADED', 'Loaded goods onto truck');

    expect(apiClient.post).toHaveBeenCalledWith('/lr-numbers/lr_123/status', {
      status: 'LOADED',
      notes: 'Loaded goods onto truck',
      location: undefined,
      force: false,
    });
    expect(res.lr_number.status).toBe('LOADED');
  });

  it('calls GET /lr-numbers/:id/history to fetch audit log trail', async () => {
    const mockHistory = {
      lr_number: 'LR-2026-000001',
      history: [
        { from_status: null, to_status: 'BOOKED' },
        { from_status: 'BOOKED', to_status: 'LOADED' },
      ],
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockHistory });

    const res = await lrApi.history('lr_123');

    expect(apiClient.get).toHaveBeenCalledWith('/lr-numbers/lr_123/history');
    expect(res.history).toHaveLength(2);
  });

  it('generates real backend PDF endpoint URL', () => {
    const url = lrApi.getPdfUrl('lr_123');
    expect(url).toBe('http://localhost:8000/api/v1/lr-numbers/lr_123/pdf');
  });
});
