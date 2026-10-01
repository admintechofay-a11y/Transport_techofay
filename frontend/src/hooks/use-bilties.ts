import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { biltyApi } from '@/lib/api/bilties.api';
import { Bilty } from '@/types/bilty.types';
import { toast } from 'sonner';

export const useBilties = (params: any = {}) => {
  return useQuery({
    queryKey: ['bilties', params],
    queryFn: () => biltyApi.list(params),
  });
};

export const useBilty = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['bilties', id],
    queryFn: () => biltyApi.get(id!),
    enabled: !!id,
  });
};

export const useCreateBilty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Bilty>) => biltyApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bilties'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success(`Bilty ${res.bilty_number} created successfully!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create Bilty.');
    },
  });
};
