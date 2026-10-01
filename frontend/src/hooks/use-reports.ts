import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports.api';

export const useReportData = (reportType: string, params: any = {}) => {
  return useQuery({
    queryKey: ['report', reportType, params],
    queryFn: () => reportsApi.getReport(reportType, params),
    enabled: !!reportType,
  });
};
