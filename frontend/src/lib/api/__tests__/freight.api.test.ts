import { describe, it, expect, vi, beforeEach } from 'vitest';
import { freightApi } from '../freight.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    defaults: { baseURL: 'http://localhost:8000/api/v1' },
  },
}));

describe('freightApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /freight-charges with params', async () => {
    const mockList = {
      data: [{ id: 1, total_charges: 25000, balance_payable: 15000 }],
      meta: { total: 1 },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockList });

    const res = await freightApi.list({ payment_status: 'partial' });

    expect(apiClient.get).toHaveBeenCalledWith('/freight-charges', { params: { payment_status: 'partial' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].total_charges).toBe(25000);
  });

  it('calls GET /freight-charges/:id to fetch specific record', async () => {
    const mockCharge = { id: 1, total_charges: 25000 };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockCharge });

    const res = await freightApi.get('1');

    expect(apiClient.get).toHaveBeenCalledWith('/freight-charges/1');
    expect(res.total_charges).toBe(25000);
  });

  it('calls POST /freight-charges to create freight charge calculation', async () => {
    const payload = {
      base_freight: 20000,
      loading_charges: 500,
      advance_paid: 5000,
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 2, total_charges: 20500, balance_payable: 15500, ...payload },
    });

    const res = await freightApi.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/freight-charges', payload);
    expect(res.total_charges).toBe(20500);
  });

  it('calls PUT /freight-charges/:id to update payment settlement', async () => {
    const updatePayload = {
      advance_paid: 20500,
      balance_payable: 0,
      payment_status: 'paid',
    };
    (apiClient.put as any).mockResolvedValueOnce({
      data: { id: 2, ...updatePayload },
    });

    const res = await freightApi.update('2', updatePayload);

    expect(apiClient.put).toHaveBeenCalledWith('/freight-charges/2', updatePayload);
    expect(res.payment_status).toBe('paid');
  });

  it('calls GET /customers/:id/statement for customer ledger', async () => {
    const mockStatement = {
      customer: { name: 'Acme Logistics' },
      total_billed: 150000,
      total_paid: 100000,
      balance_due: 50000,
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockStatement });

    const res = await freightApi.customerStatement('cust_1', '2026-01-01', '2026-03-31');

    expect(apiClient.get).toHaveBeenCalledWith('/customers/cust_1/statement', {
      params: { from_date: '2026-01-01', to_date: '2026-03-31' },
    });
    expect(res.balance_due).toBe(50000);
  });

  it('generates correct invoice and statement PDF URLs', () => {
    expect(freightApi.getInvoicePdfUrl('frt_1')).toBe('http://localhost:8000/api/v1/freight-charges/frt_1/invoice-pdf');
    expect(freightApi.getStatementPdfUrl('frt_1')).toBe('http://localhost:8000/api/v1/freight-charges/frt_1/statement-pdf');
  });
});
