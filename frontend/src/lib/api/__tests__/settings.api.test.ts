import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsApi } from '../settings.api';
import { apiClient } from '../../api-client';

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('settingsApi (WhatsApp)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches WhatsApp configuration from server', async () => {
    const mockConfig = {
      provider: 'interakt',
      is_enabled: true,
      from_number: '+919876543210',
      is_api_key_set: true,
      api_key_masked: '******1234',
      templates: {
        lr_template: 'LR #{lr_number} dispatched',
      },
    };
    (apiClient.get as any).mockResolvedValueOnce({ data: mockConfig });

    const result = await settingsApi.getWhatsApp();

    expect(apiClient.get).toHaveBeenCalledWith('/whatsapp/settings');
    expect(result.provider).toBe('interakt');
    expect(result.from_number).toBe('+919876543210');
    expect(result.templates.lr_template).toBe('LR #{lr_number} dispatched');
  });

  it('updates WhatsApp configuration on server', async () => {
    const payload = {
      provider: 'interakt',
      api_key: 'sk_live_interakt_test_key',
      from_number: '+919876543210',
      is_whatsapp_enabled: true,
      templates: {
        lr_template: 'LR #{lr_number} dispatched to {destination}',
      },
    };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { message: 'WhatsApp settings saved successfully.', settings: payload },
    });

    const res = await settingsApi.updateWhatsApp(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/whatsapp/settings', payload);
    expect(res.message).toBe('WhatsApp settings saved successfully.');
    expect(res.settings.provider).toBe('interakt');
  });

  it('dispatches test WhatsApp ping to recipient phone', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { success: true, message: 'WhatsApp test ping successfully delivered to +919876543210.' },
    });

    const res = await settingsApi.testWhatsApp('+919876543210', 'Test message');

    expect(apiClient.post).toHaveBeenCalledWith('/whatsapp/test', {
      phone: '+919876543210',
      message: 'Test message',
    });
    expect(res.success).toBe(true);
  });
});
