import { describe, it, expect, vi, beforeEach } from 'vitest';
import { biltyApi } from '../bilties.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    defaults: { baseURL: 'http://localhost:8000/api/v1' },
  },
}));

describe('biltyApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /bilties with query parameters', async () => {
    const mockList = {
      data: [{ id: 1, bilty_number: 'BL-2026-000001', freight_amount: 25000 }],
      meta: { total: 1 },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockList });

    const res = await biltyApi.list({ payment_terms: 'to_pay' });

    expect(apiClient.get).toHaveBeenCalledWith('/bilties', { params: { payment_terms: 'to_pay' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].bilty_number).toBe('BL-2026-000001');
  });

  it('calls GET /bilties/:id to retrieve single bilty', async () => {
    const mockBilty = { id: 1, bilty_number: 'BL-2026-000001' };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockBilty });

    const res = await biltyApi.get('1');

    expect(apiClient.get).toHaveBeenCalledWith('/bilties/1');
    expect(res.bilty_number).toBe('BL-2026-000001');
  });

  it('calls POST /bilties to create a Bilty with server persistence', async () => {
    const payload = {
      from_location: 'Ahmedabad',
      to_location: 'Mumbai',
      freight_amount: 30000,
      advance_amount: 10000,
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 2, bilty_number: 'BL-2026-000002', ...payload },
    });

    const res = await biltyApi.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/bilties', payload);
    expect(res.bilty_number).toBe('BL-2026-000002');
  });

  it('calls POST /bilties/:id/whatsapp to dispatch bilty via WhatsApp', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { success: true, message: 'Dispatched' },
    });

    const res = await biltyApi.shareWhatsApp('1', '+919876543210');

    expect(apiClient.post).toHaveBeenCalledWith('/bilties/1/whatsapp', { phone: '+919876543210' });
    expect(res.success).toBe(true);
  });

  it('generates correct PDF stream URL for Bilty', () => {
    const url = biltyApi.getPdfUrl('bilty_uuid_1');
    expect(url).toBe('http://localhost:8000/api/v1/bilties/bilty_uuid_1/pdf');
  });
});
