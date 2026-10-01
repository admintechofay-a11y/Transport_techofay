import { apiClient } from '../api-client';

export interface PublicVerificationResponse {
  valid: boolean;
  status: string;
  message?: string;
  document_type?: string;
  document_number?: string;
  pass_type?: string;
  vehicle_plate?: string;
  driver_name?: string;
  consignee_name?: string;
  company_name?: string;
  issued_at?: string;
  verified_at?: string;
  details?: Record<string, any>;
}

export const verifyApi = {
  verify: async (token: string): Promise<PublicVerificationResponse> => {
    const res = await apiClient.get<PublicVerificationResponse>(`/verify/${encodeURIComponent(token)}`);
    return res.data;
  },
};
