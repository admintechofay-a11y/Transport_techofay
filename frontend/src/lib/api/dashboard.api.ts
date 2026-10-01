import { apiClient } from '../api-client';

export interface DashboardMetrics {
  total_loads: number;
  today_loads: number;
  pending_loads: number;
  completed_loads: number;

  vehicles_available: number;
  vehicles_on_trip: number;
  vehicles_maintenance: number;
  vehicles_inactive: number;

  drivers_available: number;
  drivers_on_trip: number;

  pending_lrs: number;
  pending_bilties: number;

  pending_pods: number;

  total_freight_today: number;
  total_advance_today: number;
  outstanding_balance: number;

  expiring_documents: number;
  expiring_licences: number;
}

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const res = await apiClient.get('/transport/metrics');
    return res.data;
  },
};
