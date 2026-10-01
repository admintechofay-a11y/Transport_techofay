import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyApi } from '../verify.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('verifyApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /verify/:token and returns verification payload', async () => {
    const mockResponse = {
      data: {
        valid: true,
        document_type: 'gate_pass',
        document_number: 'GP-2026-000100',
        status: 'active',
        vehicle_plate: 'GJ06AX1234',
        driver_name: 'Rajesh Kumar',
        company_name: 'Technofay Logistics Ltd',
        verified_at: '2026-09-28T10:00:00Z',
      },
    };

    (apiClient.get as any).mockResolvedValueOnce(mockResponse);

    const token = 'valid_signed_hmac_token_123';
    const result = await verifyApi.verify(token);

    expect(apiClient.get).toHaveBeenCalledWith('/verify/valid_signed_hmac_token_123');
    expect(result.valid).toBe(true);
    expect(result.document_number).toBe('GP-2026-000100');
    expect(result.vehicle_plate).toBe('GJ06AX1234');
  });

  it('handles invalid or tampered token response properly', async () => {
    const mockInvalid = {
      data: {
        valid: false,
        status: 'invalid',
        message: 'Invalid, expired, or tampered QR verification token.',
      },
    };

    (apiClient.get as any).mockResolvedValueOnce(mockInvalid);

    const result = await verifyApi.verify('invalid_token');

    expect(result.valid).toBe(false);
    expect(result.status).toBe('invalid');
  });
});
