import { describe, it, expect, vi, beforeEach } from 'vitest';
import { challanApi, gatePassApi } from '../delivery-challans.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: 'http://localhost:8000/api/v1' },
  },
}));

describe('challanApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /delivery-challans with query params', async () => {
    const mockData = {
      data: [{ id: 1, challan_number: 'DC-2026-000001', status: 'pending' }],
      meta: { total: 1 },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });

    const res = await challanApi.list({ status: 'pending' });

    expect(apiClient.get).toHaveBeenCalledWith('/delivery-challans', { params: { status: 'pending' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].challan_number).toBe('DC-2026-000001');
  });

  it('calls POST /delivery-challans to issue delivery challan', async () => {
    const payload = {
      challan_number: 'DC-2026-000002',
      total_weight: 18.5,
      remarks: 'Delivered safely',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 2, ...payload },
    });

    const res = await challanApi.create(payload as any);

    expect(apiClient.post).toHaveBeenCalledWith('/delivery-challans', payload);
    expect(res.challan_number).toBe('DC-2026-000002');
  });

  it('generates correct PDF stream URL for Delivery Challan', () => {
    const url = challanApi.getPdfUrl('dc_123');
    expect(url).toBe('http://localhost:8000/api/v1/delivery-challans/dc_123/pdf');
  });

  it('calls POST /delivery-challans/:id/whatsapp to share via WhatsApp', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { success: true, message: 'Challan dispatched' },
    });

    const res = await challanApi.shareWhatsApp('dc_123', '+919820011223');

    expect(apiClient.post).toHaveBeenCalledWith('/delivery-challans/dc_123/whatsapp', { phone: '+919820011223' });
    expect(res.success).toBe(true);
  });
});

describe('gatePassApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /gate-passes with query params', async () => {
    const mockData = {
      data: [{ id: 1, gate_pass_number: 'GP-2026-000001', pass_type: 'out' }],
      meta: { total: 1 },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });

    const res = await gatePassApi.list({ pass_type: 'out' });

    expect(apiClient.get).toHaveBeenCalledWith('/gate-passes', { params: { pass_type: 'out' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].gate_pass_number).toBe('GP-2026-000001');
  });

  it('calls POST /gate-passes to generate a gate security pass', async () => {
    const payload = {
      gate_pass_number: 'GP-2026-000002',
      pass_type: 'in' as const,
      security_name: 'Officer Rajesh',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 2, ...payload, qr_token: 'signed.hmac.token' },
    });

    const res = await gatePassApi.create(payload as any);

    expect(apiClient.post).toHaveBeenCalledWith('/gate-passes', payload);
    expect(res.gate_pass_number).toBe('GP-2026-000002');
  });

  it('generates correct PDF stream URL for Gate Pass', () => {
    const url = gatePassApi.getPdfUrl('gp_123');
    expect(url).toBe('http://localhost:8000/api/v1/gate-passes/gp_123/pdf');
  });
});
