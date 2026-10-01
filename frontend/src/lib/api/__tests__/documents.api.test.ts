import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vehicleApi } from '../vehicles.api';
import { driverApi } from '../drivers.api';
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

describe('Document Compliance API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /vehicle-documents to upload vehicle document', async () => {
    const payload = {
      vehicle_uuid: 'veh_uuid_10',
      document_type: 'insurance',
      document_number: 'POL-100200',
      expiry_date: '2027-03-31',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 1, ...payload },
    });

    const res = await vehicleApi.addDocument(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/vehicle-documents', payload);
    expect(res.id).toBe(1);
    expect(res.document_type).toBe('insurance');
  });

  it('calls GET /vehicle-documents/expiring with days threshold', async () => {
    const mockExpiring = {
      days_threshold: 30,
      total_expiring: 1,
      documents: [{ id: 1, document_type: 'puc', expiry_date: '2026-10-15' }],
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockExpiring });

    const res = await vehicleApi.getExpiringDocuments(30);

    expect(apiClient.get).toHaveBeenCalledWith('/vehicle-documents/expiring', {
      params: { days: 30 },
    });
    expect(res.total_expiring).toBe(1);
  });

  it('generates correct backend download URL for vehicle document', () => {
    const url = vehicleApi.getDocumentDownloadUrl('vdoc_123');
    expect(url).toBe('http://localhost:8000/api/v1/vehicle-documents/vdoc_123/download');
  });

  it('calls POST /driver-documents to upload driver document', async () => {
    const payload = {
      driver_uuid: 'drv_uuid_20',
      document_type: 'driving_licence',
      document_number: 'DL-MH-123456',
      expiry_date: '2028-11-20',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 5, ...payload },
    });

    const res = await driverApi.addDocument(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/driver-documents', payload);
    expect(res.id).toBe(5);
    expect(res.document_type).toBe('driving_licence');
  });

  it('calls GET /driver-documents/expiring with days threshold', async () => {
    const mockExpiring = {
      days_threshold: 45,
      total_expiring_documents: 2,
      documents: [{ id: 5, document_type: 'driving_licence' }],
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockExpiring });

    const res = await driverApi.getExpiringDocuments(45);

    expect(apiClient.get).toHaveBeenCalledWith('/driver-documents/expiring', {
      params: { days: 45 },
    });
    expect(res.total_expiring_documents).toBe(2);
  });

  it('generates correct backend download URL for driver document', () => {
    const url = driverApi.getDocumentDownloadUrl('ddoc_456');
    expect(url).toBe('http://localhost:8000/api/v1/driver-documents/ddoc_456/download');
  });
});
