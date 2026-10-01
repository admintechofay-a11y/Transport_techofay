import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { freightApi } from '@/lib/api/freight.api';
import { FreightCharge } from '@/types/freight.types';
import { toast } from 'sonner';

export const useFreightCharges = (params: any = {}) => {
  return useQuery({
    queryKey: ['freight-charges', params],
    queryFn: () => freightApi.list(params),
  });
};

export const useFreightCharge = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['freight-charges', id],
    queryFn: () => freightApi.get(id!),
    enabled: !!id,
  });
};

export const useCreateFreightCharge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FreightCharge>) => freightApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freight-charges'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Freight charge recorded successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record freight charge.');
    },
  });
};

export const useUpdateFreightCharge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FreightCharge> }) => freightApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['freight-charges'] });
      queryClient.invalidateQueries({ queryKey: ['freight-charges', id] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Freight charges updated successfully!');
    },
  });
};

export const useCustomerStatement = (customerUuid: string | null | undefined, fromDate?: string, toDate?: string) => {
  return useQuery({
    queryKey: ['customer-statement', customerUuid, fromDate, toDate],
    queryFn: () => freightApi.customerStatement(customerUuid!, fromDate, toDate),
    enabled: !!customerUuid,
  });
};
