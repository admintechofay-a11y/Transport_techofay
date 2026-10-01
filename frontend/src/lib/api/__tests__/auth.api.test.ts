import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '../auth.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /auth/login with credentials', async () => {
    const mockResponse = {
      data: {
        token: 'real_sanctum_bearer_token_123',
        type: 'user',
        user: { name: 'Dispatch Officer', email: 'dispatcher@technofay.com' },
      },
    };
    (apiClient.post as any).mockResolvedValueOnce(mockResponse);

    const result = await authApi.login({
      identity: 'dispatcher@technofay.com',
      password: 'SecurePassword123!',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      identity: 'dispatcher@technofay.com',
      password: 'SecurePassword123!',
    });
    expect(result.token).toBe('real_sanctum_bearer_token_123');
  });

  it('calls POST /auth/logout to invalidate backend session', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: ['Goodbye'] });
    await authApi.logout();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('calls GET /auth/session to retrieve user session details', async () => {
    const mockSession = { user: 'user_uuid_1', type: 'user' };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockSession });

    const session = await authApi.getSession();
    expect(apiClient.get).toHaveBeenCalledWith('/auth/session');
    expect(session.user).toBe('user_uuid_1');
  });
});
