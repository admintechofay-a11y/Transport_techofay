import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerApi } from '../customers.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('customerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists customers with filters', async () => {
    const mockResponse = {
      data: [
        { id: 'cust-1', name: 'Reliance Retail', gstin: '27AAACR1234F1Z1', party_type: 'customer' },
        { id: 'cust-2', name: 'Tata Steel', gstin: '20AAACT5678K1Z2', party_type: 'consignor' },
      ],
      total: 2,
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockResponse });

    const result = await customerApi.list({ search: 'Reliance' });

    expect(apiClient.get).toHaveBeenCalledWith('/contacts', { params: { search: 'Reliance' } });
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Reliance Retail');
  });

  it('creates customer party with real API payload', async () => {
    const payload = {
      name: 'Adani Logistics Hub',
      phone: '+91 98250 99887',
      gstin: '24AAACA9999M1Z3',
      party_type: 'consignee',
      billing_city: 'Mundra',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { contact: { id: 'cust-3', ...payload } },
    });

    const created = await customerApi.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/contacts', payload);
    expect(created.name).toBe('Adani Logistics Hub');
    expect(created.gstin).toBe('24AAACA9999M1Z3');
  });

  it('fetches customer by id', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: { contact: { id: 'cust-1', name: 'Reliance Retail' } },
    });

    const res = await customerApi.get('cust-1');

    expect(apiClient.get).toHaveBeenCalledWith('/contacts/cust-1');
    expect(res.name).toBe('Reliance Retail');
  });
});
