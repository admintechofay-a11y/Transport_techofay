import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '@/lib/api/drivers.api';
import { Driver, DriverDocument } from '@/types/driver.types';
import { toast } from 'sonner';

import { useTransportStore } from '@/stores/transport-data.store';

export const useDrivers = (params: any = {}) => {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => driverApi.list(params),
  });
};

export const useDriver = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['drivers', id],
    queryFn: () => driverApi.get(id!),
    enabled: !!id,
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Driver>) => driverApi.create(data),
    onSuccess: (newDriver) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      if (newDriver) {
        useTransportStore.getState().addDriver(newDriver);
      }
      toast.success('Driver registered successfully!');
    },
  });
};

export const useAddDriverDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DriverDocument>) => driverApi.addDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-driver-docs'] });
      toast.success('Driver document uploaded successfully!');
    },
  });
};

export const useExpiringDriverDocs = (days: number = 30) => {
  return useQuery({
    queryKey: ['expiring-driver-docs', days],
    queryFn: () => driverApi.getExpiringDocuments(days),
  });
};
