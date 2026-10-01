import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadApi } from '../loads.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: 'http://localhost:8000/api/v1' },
  },
}));

describe('loadApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /orders with filters', async () => {
    const mockList = {
      data: [{ id: 1, load_number: 'LD-2026-1001', status: 'dispatched' }],
      meta: { total: 1 },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockList });

    const res = await loadApi.list({ status: 'dispatched' });

    expect(apiClient.get).toHaveBeenCalledWith('/orders', { params: { status: 'dispatched' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].load_number).toBe('LD-2026-1001');
  });

  it('calls GET /orders/:id to fetch single consignment', async () => {
    const mockLoad = { id: 1, load_number: 'LD-2026-1001' };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockLoad });

    const res = await loadApi.get('1');

    expect(apiClient.get).toHaveBeenCalledWith('/orders/1');
    expect(res.load_number).toBe('LD-2026-1001');
  });

  it('calls POST /orders to create consignment load', async () => {
    const payload = {
      total_freight: 45000,
      advance_amount: 15000,
      load_type: 'FTL',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 5, load_number: 'LD-2026-5555', ...payload },
    });

    const res = await loadApi.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/orders', payload);
    expect(res.load_number).toBe('LD-2026-5555');
  });

  it('calls PATCH /orders/:id/status to advance status', async () => {
    (apiClient.patch as any).mockResolvedValueOnce({
      data: { id: 5, status: 'in_transit' },
    });

    const res = await loadApi.updateStatus('5', 'in_transit');

    expect(apiClient.patch).toHaveBeenCalledWith('/orders/5/status', { status: 'in_transit' });
    expect(res.status).toBe('in_transit');
  });

  it('generates correct PDF stream URLs for loading slip and trip sheet', () => {
    expect(loadApi.getLoadingSlipPdfUrl('ord_1')).toBe('http://localhost:8000/api/v1/orders/ord_1/loading-slip-pdf');
    expect(loadApi.getTripSheetPdfUrl('ord_1')).toBe('http://localhost:8000/api/v1/orders/ord_1/trip-sheet-pdf');
  });
});
