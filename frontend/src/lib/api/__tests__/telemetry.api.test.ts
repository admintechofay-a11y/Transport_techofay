import { describe, it, expect, vi, beforeEach } from 'vitest';
import { telemetryApi } from '../telemetry.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('telemetryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ingests single telemetry GPS payload', async () => {
    const payload = {
      vehicle_uuid: 'vehicle-101',
      latitude: 28.6139,
      longitude: 77.2090,
      speed: 55.4,
      heading: 180,
    };

    const mockResponse = {
      success: true,
      position_uuid: 'pos-abc-123',
      company_uuid: 'company-xyz',
      vehicle_uuid: 'vehicle-101',
      latitude: 28.6139,
      longitude: 77.2090,
      speed: 55.4,
      heading: 180,
      timestamp: '2026-09-28T14:30:00Z',
    };

    (apiClient.post as any).mockResolvedValueOnce({ data: mockResponse });

    const result = await telemetryApi.ingest(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/telemetry', payload);
    expect(result.success).toBe(true);
    expect(result.position_uuid).toBe('pos-abc-123');
    expect(result.latitude).toBe(28.6139);
  });

  it('ingests batch telemetry positions', async () => {
    const positions = [
      { latitude: 28.5001, longitude: 77.3001, speed: 45 },
      { latitude: 28.5005, longitude: 77.3009, speed: 48 },
    ];

    const mockResponse = {
      success: true,
      count: 2,
      items: [
        { success: true, position_uuid: 'pos-1', latitude: 28.5001, longitude: 77.3001 },
        { success: true, position_uuid: 'pos-2', latitude: 28.5005, longitude: 77.3009 },
      ],
    };

    (apiClient.post as any).mockResolvedValueOnce({ data: mockResponse });

    const result = await telemetryApi.batchIngest(positions);

    expect(apiClient.post).toHaveBeenCalledWith('/telemetry', { positions });
    expect(result.count).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('queries latest telemetry positions for active fleet', async () => {
    const mockPositions = [
      {
        id: 'pos-1',
        uuid: 'pos-1',
        latitude: 28.6139,
        longitude: 77.2090,
        speed: 52.0,
      },
    ];

    (apiClient.get as any).mockResolvedValueOnce({ data: { positions: mockPositions } });

    const result = await telemetryApi.latest({ vehicle_uuid: 'vehicle-101' });

    expect(apiClient.get).toHaveBeenCalledWith('/telemetry/latest', {
      params: { vehicle_uuid: 'vehicle-101' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].latitude).toBe(28.6139);
  });
});
