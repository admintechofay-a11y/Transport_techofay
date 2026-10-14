import { apiClient } from '../api-client';
import { User, Company } from '@/types/api.types';

export interface LoginCredentials {
  identity: string;
  password: string;
  authToken?: string;
}

export interface LoginResponse {
  token: string;
  type?: string;
  user?: User;
  company?: Company;
}

const normalizeAuthResponse = (payload: unknown): LoginResponse => {
  const body = payload && typeof payload === 'object' && 'data' in payload && !('token' in payload)
    ? (payload as { data: unknown }).data
    : payload;

  const response = (body ?? {}) as LoginResponse & { access_token?: string };
  const token = response.token || response.access_token;

  if (!token?.trim()) {
    throw new Error('Authentication response did not include an access token.');
  }

  return { ...response, token };
};

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company_name?: string;
}

export const authApi = {
  /**
   * Authenticate with identity (email or phone) and password against POST /int/v1/auth/login
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return normalizeAuthResponse(response.data);
  },

  /**
   * Sign up a new user/company against POST /int/v1/auth/sign-up
   */
  signUp: async (payload: SignUpPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/sign-up', payload);
    return normalizeAuthResponse(response.data);
  },

  /**
   * Terminate active session against POST /int/v1/auth/logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Best-effort logout: even if server fails or network down, clear client session
    }
  },

  /**
   * Fetch current session details from GET /int/v1/auth/session
   */
  getSession: async (): Promise<any> => {
    const response = await apiClient.get('/auth/session');
    return response.data;
  },

  /**
   * Fetch organizations accessible to authenticated user from GET /int/v1/auth/organizations
   */
  getOrganizations: async (): Promise<Company[]> => {
    const response = await apiClient.get<Company[]>('/auth/organizations');
    return response.data;
  },

  /**
   * Switch active company context in session
   */
  switchOrganization: async (organizationUuid: string): Promise<any> => {
    const response = await apiClient.post('/auth/switch-organization', {
      organization: organizationUuid,
    });
    return response.data;
  },
};
