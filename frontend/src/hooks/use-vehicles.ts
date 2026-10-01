import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleApi } from '@/lib/api/vehicles.api';
import { Vehicle, VehicleDocument } from '@/types/vehicle.types';
import { toast } from 'sonner';

import { useTransportStore } from '@/stores/transport-data.store';

export const useVehicles = (params: any = {}) => {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehicleApi.list(params),
  });
};

export const useVehicle = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => vehicleApi.get(id!),
    enabled: !!id,
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vehicle>) => vehicleApi.create(data),
    onSuccess: (newVehicle) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      if (newVehicle) {
        useTransportStore.getState().addVehicle(newVehicle);
      }
      toast.success('Vehicle registered successfully!');
    },
  });
};

export const useAddVehicleDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VehicleDocument>) => vehicleApi.addDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-vehicle-docs'] });
      toast.success('Document uploaded successfully!');
    },
  });
};

export const useExpiringVehicleDocs = (days: number = 30) => {
  return useQuery({
    queryKey: ['expiring-vehicle-docs', days],
    queryFn: () => vehicleApi.getExpiringDocuments(days),
  });
};
