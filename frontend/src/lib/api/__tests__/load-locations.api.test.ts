import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadLocationsApi } from '../load-locations.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('loadLocationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /load-locations with params', async () => {
    const mockList = {
      data: [{ id: 1, sequence: 1, location_type: 'pickup', status: 'pending' }],
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockList });

    const res = await loadLocationsApi.list({ load_uuid: 'order_1' });

    expect(apiClient.get).toHaveBeenCalledWith('/load-locations', { params: { load_uuid: 'order_1' } });
    expect(res.data).toHaveLength(1);
    expect(res.data[0].location_type).toBe('pickup');
  });

  it('calls POST /load-locations to create stop', async () => {
    const payload = {
      load_uuid: 'order_1',
      sequence: 1,
      location_type: 'pickup',
      contact_name: 'Surat Depot',
    };
    (apiClient.post as any).mockResolvedValueOnce({ data: { id: 10, ...payload, status: 'pending' } });

    const res = await loadLocationsApi.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/load-locations', payload);
    expect(res.id).toBe(10);
    expect(res.contact_name).toBe('Surat Depot');
  });

  it('calls PATCH /load-locations/:id/status to advance waypoint status', async () => {
    (apiClient.patch as any).mockResolvedValueOnce({
      data: { id: 10, status: 'loaded' },
    });

    const res = await loadLocationsApi.updateStatus('10', 'loaded', 'Material loaded successfully');

    expect(apiClient.patch).toHaveBeenCalledWith('/load-locations/10/status', {
      status: 'loaded',
      remarks: 'Material loaded successfully',
    });
    expect(res.status).toBe('loaded');
  });

  it('calls POST /load-locations/:id/complete to mark delivery stop complete', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { id: 10, status: 'delivered' },
    });

    const res = await loadLocationsApi.complete('10', 'Unloaded safely');

    expect(apiClient.post).toHaveBeenCalledWith('/load-locations/10/complete', { remarks: 'Unloaded safely' });
    expect(res.status).toBe('delivered');
  });
});
