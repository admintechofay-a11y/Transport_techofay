import { describe, it, expect, vi, beforeEach } from 'vitest';
import { podApi } from '../pod.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '/int/v1' },
  },
}));

describe('podApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /proofs with filters and returns list', async () => {
    const mockData = {
      data: [{ id: 'proof_1', public_id: 'proof_1', order_uuid: 'order_123' }],
      total: 1,
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockData });

    const result = await podApi.list({ search: 'Sharma' });

    expect(apiClient.get).toHaveBeenCalledWith('/proofs', { params: { search: 'Sharma' } });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('proof_1');
  });

  it('calls POST /proofs to submit POD and returns created record', async () => {
    const payload = {
      order_uuid: 'order_123',
      receiver_name: 'Rajesh Sharma',
      receiver_phone: '+91 9876543210',
      latitude: 19.076,
      longitude: 72.877,
      remarks: 'Delivered at Gate 2',
    };

    const mockResponse = {
      data: {
        proof: {
          id: 'proof_new',
          public_id: 'proof_new',
          order_uuid: 'order_123',
          data: {
            receiver_name: 'Rajesh Sharma',
            latitude: 19.076,
          },
        },
      },
    };

    (apiClient.post as any).mockResolvedValueOnce(mockResponse);

    const result = await podApi.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/proofs', payload);
    expect(result.id).toBe('proof_new');
    expect(result.data?.receiver_name).toBe('Rajesh Sharma');
  });

  it('constructs correct PDF URL for POD certificate stream', () => {
    const url = podApi.getPdfUrl('proof_123');
    expect(url).toBe('/int/v1/proofs/proof_123/pdf');
  });
});
