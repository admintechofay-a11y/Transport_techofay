import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadApi } from '@/lib/api/loads.api';
import { LoadFilters, Load } from '@/types/load.types';
import { toast } from 'sonner';

export const useLoads = (filters: LoadFilters = {}) => {
  return useQuery({
    queryKey: ['loads', filters],
    queryFn: () => loadApi.list(filters),
  });
};

export const useLoad = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['loads', id],
    queryFn: () => loadApi.get(id!),
    enabled: !!id,
  });
};

export const useCreateLoad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Load>) => loadApi.create(data),
    onSuccess: (newLoad) => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success(`Load ${newLoad.load_number || newLoad.public_id} created successfully!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create load.');
    },
  });
};

export const useUpdateLoadStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => loadApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['loads', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Load status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update load status.');
    },
  });
};
