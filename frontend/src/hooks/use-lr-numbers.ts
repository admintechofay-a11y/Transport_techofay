import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lrApi } from '@/lib/api/lr-numbers.api';
import { LrNumber } from '@/types/lr-number.types';
import { toast } from 'sonner';

export const useLrNumbers = (params: any = {}) => {
  return useQuery({
    queryKey: ['lr-numbers', params],
    queryFn: () => lrApi.list(params),
  });
};

export const useLrNumber = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['lr-numbers', id],
    queryFn: () => lrApi.get(id!),
    enabled: !!id,
  });
};

export const useCreateLrNumber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LrNumber>) => lrApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['lr-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success(`LR Number ${res.lr_number} generated!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to generate LR.');
    },
  });
};

export const useUpdateLrStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes, location, force }: { id: string; status: string; notes?: string; location?: string; force?: boolean }) =>
      lrApi.updateStatus(id, status, notes, location, force),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['lr-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['lr-numbers', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('LR status updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update LR status.');
    },
  });
};

export const useLrHistory = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['lr-history', id],
    queryFn: () => lrApi.history(id!),
    enabled: !!id,
  });
};
