import { apiClient } from '../api-client';

export interface WhatsAppConfig {
  provider: 'twilio' | 'gupshup' | '360dialog' | 'interakt' | string;
  api_key_masked?: string;
  api_secret_masked?: string;
  is_api_key_set: boolean;
  is_api_secret_set: boolean;
  from_number?: string;
  base_url?: string;
  is_enabled: boolean;
  templates: Record<string, string>;
}

export const settingsApi = {
  getWhatsApp: async (): Promise<WhatsAppConfig> => {
    const res = await apiClient.get('/whatsapp/settings');
    return res.data;
  },

  updateWhatsApp: async (data: any): Promise<any> => {
    const res = await apiClient.post('/whatsapp/settings', data);
    return res.data;
  },

  testWhatsApp: async (phone: string, message?: string): Promise<any> => {
    const res = await apiClient.post('/whatsapp/test', { phone, message });
    return res.data;
  },

  getTemplates: async (): Promise<{ templates: Record<string, string> }> => {
    const res = await apiClient.get('/whatsapp/templates');
    return res.data;
  },

  updateTemplates: async (templates: Record<string, string>): Promise<any> => {
    const res = await apiClient.post('/whatsapp/templates', { templates });
    return res.data;
  },
};

export { customerApi } from './customers.api';

