import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vehicleApi } from '../vehicles.api';
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

describe('vehicleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /vehicles with query params', async () => {
    const mockList = {
      data: [{ id: 1, plate_number: 'MH 12 AB 1234', status: 'available' }],
      meta: { total: 1 },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockList });

    const res = await vehicleApi.list({ status: 'available' });

    expect(apiClient.get).toHaveBeenCalledWith('/vehicles', { params: { status: 'available' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].plate_number).toBe('MH 12 AB 1234');
  });

  it('calls GET /vehicles/:id to fetch a specific vehicle', async () => {
    const mockVehicle = { id: 1, plate_number: 'MH 12 AB 1234', make: 'Tata' };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockVehicle });

    const res = await vehicleApi.get('1');

    expect(apiClient.get).toHaveBeenCalledWith('/vehicles/1');
    expect(res.plate_number).toBe('MH 12 AB 1234');
  });

  it('calls POST /vehicles to create a vehicle on the server', async () => {
    const newVehicleData = {
      plate_number: 'GJ 06 XX 9999',
      make: 'Tata',
      model: 'Prima 4028',
      status: 'available',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 2, ...newVehicleData },
    });

    const res = await vehicleApi.create(newVehicleData);

    expect(apiClient.post).toHaveBeenCalledWith('/vehicles', newVehicleData);
    expect(res.id).toBe(2);
    expect(res.plate_number).toBe('GJ 06 XX 9999');
  });

  it('calls PUT /vehicles/:id to update vehicle state', async () => {
    (apiClient.put as any).mockResolvedValueOnce({
      data: { id: 2, status: 'maintenance' },
    });

    const res = await vehicleApi.update('2', { status: 'maintenance' });

    expect(apiClient.put).toHaveBeenCalledWith('/vehicles/2', { status: 'maintenance' });
    expect(res.status).toBe('maintenance');
  });

  it('calls DELETE /vehicles/:id to delete vehicle', async () => {
    (apiClient.delete as any).mockResolvedValueOnce({ data: { message: 'Deleted' } });

    await vehicleApi.delete('2');

    expect(apiClient.delete).toHaveBeenCalledWith('/vehicles/2');
  });

  it('calls POST /vehicle-documents to persist uploaded vehicle document', async () => {
    const docData = {
      vehicle_uuid: 'vehicle_uuid_1',
      document_type: 'rc',
      expiry_date: '2027-12-31',
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 10, ...docData },
    });

    const res = await vehicleApi.addDocument(docData);

    expect(apiClient.post).toHaveBeenCalledWith('/vehicle-documents', docData);
    expect(res.id).toBe(10);
  });
});
