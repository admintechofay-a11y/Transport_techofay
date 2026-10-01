import { apiClient } from '../api-client';

export interface SearchResultItem {
  label: string;
  description: string;
  icon: string;
  type: string;
  route: string;
  queryParams?: Record<string, string>;
  breadcrumb?: string;
}

export const searchApi = {
  search: async (query: string, limit: number = 12): Promise<{ results: SearchResultItem[] }> => {
    const res = await apiClient.get('/search', { params: { query, limit } });
    return res.data;
  },
};
