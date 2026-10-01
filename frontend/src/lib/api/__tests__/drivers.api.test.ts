import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('driverApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /drivers with query params', async () => {
    const mockList = {
      data: [{ id: 1, name: 'Raju Driver', phone: '9876543210', status: 'available' }],
      meta: { total: 1 },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockList });

    const res = await driverApi.list({ status: 'available' });

    expect(apiClient.get).toHaveBeenCalledWith('/drivers', { params: { status: 'available' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].name).toBe('Raju Driver');
  });

  it('calls GET /drivers/:id to fetch a specific driver', async () => {
    const mockDriver = { id: 1, name: 'Raju Driver', phone: '9876543210' };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockDriver });

    const res = await driverApi.get('1');

    expect(apiClient.get).toHaveBeenCalledWith('/drivers/1');
    expect(res.name).toBe('Raju Driver');
  });

  it('calls POST /drivers to create a driver on the server', async () => {
    const newDriverData = {
      name: 'Compliant Driver',
      phone: '9876543204',
      status: 'available',
      driving_licence_number: 'DL-2026-COMPLIANT',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 2, ...newDriverData },
    });

    const res = await driverApi.create(newDriverData);

    expect(apiClient.post).toHaveBeenCalledWith('/drivers', newDriverData);
    expect(res.id).toBe(2);
    expect(res.name).toBe('Compliant Driver');
  });

  it('calls PUT /drivers/:id to update driver state', async () => {
    (apiClient.put as any).mockResolvedValueOnce({
      data: { id: 2, status: 'on_leave' },
    });

    const res = await driverApi.update('2', { status: 'on_leave' });

    expect(apiClient.put).toHaveBeenCalledWith('/drivers/2', { status: 'on_leave' });
    expect(res.status).toBe('on_leave');
  });

  it('calls DELETE /drivers/:id to delete driver', async () => {
    (apiClient.delete as any).mockResolvedValueOnce({ data: { message: 'Deleted' } });

    await driverApi.delete('2');

    expect(apiClient.delete).toHaveBeenCalledWith('/drivers/2');
  });

  it('calls POST /driver-documents to persist uploaded driver document', async () => {
    const docData = {
      driver_uuid: 'driver_uuid_1',
      document_type: 'driving_licence',
      expiry_date: '2028-05-15',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 20, ...docData },
    });

    const res = await driverApi.addDocument(docData);

    expect(apiClient.post).toHaveBeenCalledWith('/driver-documents', docData);
    expect(res.id).toBe(20);
  });
});
