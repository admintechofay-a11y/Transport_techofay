import { apiClient } from '../api-client';

export const reportsApi = {
  getReport: async (reportType: string, params: any = {}): Promise<any> => {
    const res = await apiClient.get(`/transport/reports/${reportType}`, { params });
    return res.data;
  },

  getExcelExportUrl: (reportType: string, params: any = {}): string => {
    const query = new URLSearchParams(params).toString();
    return `${apiClient.defaults.baseURL}/transport/reports/export/${reportType}/excel?${query}`;
  },

  getPdfExportUrl: (reportType: string, params: any = {}): string => {
    const query = new URLSearchParams(params).toString();
    return `${apiClient.defaults.baseURL}/transport/reports/export/${reportType}/pdf?${query}`;
  },
};
