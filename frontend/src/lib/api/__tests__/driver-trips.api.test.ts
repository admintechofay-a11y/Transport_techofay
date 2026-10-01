import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driverTripApi } from '../driver-trips.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('driverTripApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists driver trips with parameters', async () => {
    const mockResponse = {
      data: [
        { id: 'trip-1', load_number: 'TRIP-001', status: 'dispatched' },
        { id: 'trip-2', load_number: 'TRIP-002', status: 'in_transit' },
      ],
      total: 2,
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockResponse });

    const result = await driverTripApi.list({ active: true });

    expect(apiClient.get).toHaveBeenCalledWith('/driver/trips', { params: { active: true } });
    expect(result.data).toHaveLength(2);
    expect(result.data[0].load_number).toBe('TRIP-001');
  });

  it('accepts and starts assigned trip', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { trip: { id: 'trip-1', status: 'driver_accepted' } },
    });
    const accepted = await driverTripApi.accept('trip-1');
    expect(apiClient.post).toHaveBeenCalledWith('/driver/trips/trip-1/accept');
    expect(accepted.status).toBe('driver_accepted');

    (apiClient.post as any).mockResolvedValueOnce({
      data: { trip: { id: 'trip-1', status: 'in_transit' } },
    });
    const started = await driverTripApi.start('trip-1');
    expect(apiClient.post).toHaveBeenCalledWith('/driver/trips/trip-1/start');
    expect(started.status).toBe('in_transit');
  });

  it('handles stop actions and trip completion', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        trip: { id: 'trip-1', status: 'in_transit' },
        stop: { id: 'stop-1', status: 'loaded' },
      },
    });
    const stopResult = await driverTripApi.completeStop('trip-1', {
      stop_id: 'stop-1',
      remarks: 'Loading completed',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/driver/trips/trip-1/complete-stop', {
      stop_id: 'stop-1',
      remarks: 'Loading completed',
    });
    expect(stopResult.stop.status).toBe('loaded');

    (apiClient.post as any).mockResolvedValueOnce({
      data: { trip: { id: 'trip-1', status: 'completed' } },
    });
    const completed = await driverTripApi.complete('trip-1', { odometer_end: '55000' });
    expect(apiClient.post).toHaveBeenCalledWith('/driver/trips/trip-1/complete', {
      odometer_end: '55000',
    });
    expect(completed.status).toBe('completed');
  });
});
