import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challanApi, gatePassApi } from '@/lib/api/delivery-challans.api';
import { DeliveryChallan, GatePass } from '@/types/delivery-challan.types';
import { toast } from 'sonner';

export const useDeliveryChallans = (params: any = {}) => {
  return useQuery({
    queryKey: ['delivery-challans', params],
    queryFn: () => challanApi.list(params),
  });
};

export const useCreateDeliveryChallan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DeliveryChallan>) => challanApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-challans'] });
      toast.success(`Delivery Challan ${res.challan_number} created!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create delivery challan.');
    },
  });
};

export const useUpdateDeliveryChallan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DeliveryChallan> }) => challanApi.update(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-challans'] });
      toast.success(`Delivery Challan ${res.challan_number} updated!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update delivery challan.');
    },
  });
};

export const useDeleteDeliveryChallan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => challanApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-challans'] });
      toast.success('Delivery Challan deleted.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete delivery challan.');
    },
  });
};

export const useGatePasses = (params: any = {}) => {
  return useQuery({
    queryKey: ['gate-passes', params],
    queryFn: () => gatePassApi.list(params),
  });
};

export const useCreateGatePass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GatePass>) => gatePassApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
      toast.success(`Gate Pass ${res.gate_pass_number} generated!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate gate pass.');
    },
  });
};

export const useRecordGatePassExit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gatePassApi.recordExit(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
      toast.success(`Exit recorded for Gate Pass ${res.gate_pass_number}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record gate pass exit.');
    },
  });
};

export const useDeleteGatePass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gatePassApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
      toast.success('Gate Pass deleted.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete gate pass.');
    },
  });
};
