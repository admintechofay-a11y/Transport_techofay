import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/lib/api/customers.api';
import { CustomerParty, CustomerFilters } from '@/types/customer.types';
import { toast } from 'sonner';

export const useCustomers = (filters: CustomerFilters = {}) => {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customerApi.list(filters),
  });
};

export const useCustomer = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customerApi.get(id!),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CustomerParty>) => customerApi.create(data),
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer party "${newCustomer.name}" added to transport accounts!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create customer party.');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerParty> }) => customerApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer party "${updated.name}" updated successfully.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update customer party.');
    },
  });
};
