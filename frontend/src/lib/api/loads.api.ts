import { apiClient } from '../api-client';
import { Load, LoadFilters } from '@/types/load.types';
import { PaginatedResponse } from '@/types/api.types';

type LoadInput = Partial<Load> & Record<string, any>;

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getOrderConfigUuid = (value: unknown): string | undefined => {
  if (!isRecord(value)) return undefined;

  return (
    value.uuid ||
    value.order_config_uuid ||
    value.public_id ||
    value.data?.uuid ||
    value.data?.order_config_uuid ||
    value.order_config?.uuid
  );
};

const toPlace = (location: unknown, party: unknown, fallbackName: string) => {
  const source = isRecord(location) ? location : {};
  const contact = isRecord(party) ? party : {};

  return {
    name: source.name || contact.name || fallbackName,
    street1: source.address || source.street1 || contact.address || undefined,
    city: source.city || contact.city || undefined,
    phone: source.phone || contact.phone || undefined,
    // Do not invent a country for free-text locations. Fleetbase treats a
    // country-only place as a geocoding request, which makes local admission
    // depend on an external Google Maps request. Keep names local until the
    // user supplies a real address or coordinates.
    country: source.country || contact.country || undefined,
    meta: {
      contact_name: contact.name || undefined,
      gstin: contact.gstin || undefined,
    },
  };
};

const toEntity = (item: unknown) => {
  const source = isRecord(item) ? item : {};
  const quantity = source.quantity === '' || source.quantity === undefined ? undefined : Number(source.quantity);
  const weight = source.weight === '' || source.weight === undefined ? undefined : Number(source.weight);
  const rawAmount = source.amount ?? source.declared_value;
  const amount = rawAmount === '' || rawAmount === undefined ? undefined : Number(rawAmount);

  return {
    uuid: source.uuid,
    name: source.name || source.material || source.description || 'Cargo item',
    description: source.description || source.material || undefined,
    type: source.type || source.package_type || 'cargo',
    quantity: Number.isNaN(quantity) ? undefined : quantity,
    weight: Number.isNaN(weight) ? undefined : weight,
    weight_unit: source.weight_unit || source.unit || 'kg',
    declared_value: Number.isNaN(amount) ? undefined : amount,
    meta: {
      quantity: source.quantity,
      unit: source.unit,
      package_type: source.package_type,
      rate: source.rate,
      amount: source.amount,
      remarks: source.remarks,
      eway_bill_number: source.eway_bill_number,
    },
  };
};

const normalizeOrderPayload = (data: LoadInput, orderConfigUuid: string) => {
  const existingPayload = isRecord(data.payload) ? data.payload : {};
  const sourceMeta = isRecord(data.meta) ? data.meta : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const payload = {
    ...existingPayload,
    pickup: existingPayload.pickup || toPlace(data.origin_location, data.consignor, 'Origin Hub'),
    dropoff: existingPayload.dropoff || toPlace(data.destination_location, data.consignee, 'Destination Hub'),
    entities: Array.isArray(existingPayload.entities) ? existingPayload.entities : items.map(toEntity),
  };

  const driverUuid = data.driver_uuid || data.order?.driver_assigned_uuid;
  const vehicleUuid = data.vehicle_uuid || data.order?.vehicle_assigned_uuid;
  const shouldDispatch = data.dispatched !== undefined
    ? Boolean(data.dispatched)
    : data.dispatch !== undefined
      ? Boolean(data.dispatch)
      : data.status === 'dispatched' || Boolean(data.order?.dispatched);

  return {
    ...data.order,
    order_config_uuid: orderConfigUuid,
    type: data.type || data.order?.type || 'transport',
    status: data.status === 'pending' ? 'created' : (data.status || data.order?.status || 'created'),
    dispatch: shouldDispatch,
    dispatched: shouldDispatch,
    pod_required: data.pod_required ?? false,
    scheduled_at: data.scheduled_pickup || data.pickup_datetime || data.order?.scheduled_at,
    notes: data.notes || data.customer_reference || data.order?.notes,
    driver: driverUuid || (data as Record<string, any>).driver?.uuid || data.order?.driver,
    driver_assigned_uuid: driverUuid || undefined,
    vehicle_assigned_uuid: vehicleUuid || undefined,
    customer: data.customer_uuid || data.customer?.uuid || data.order?.customer,
    meta: {
      ...sourceMeta,
      load_number: data.load_number,
      customer_reference: data.customer_reference,
      load_type: data.load_type,
      service_type: data.service_type,
      total_freight: data.total_freight,
      advance_amount: data.advance_amount,
      balance_amount: data.balance_amount,
      eway_bill_number: data.eway_bill_number,
      vehicle_plate: data.vehicle?.plate_number,
      driver_name: data.driver?.name,
      driver_phone: data.driver?.phone,
      owner_name: data.owner_name || data.vehicle_owner_name,
      owner_address: data.owner_address,
    },
    payload,
  };
};

const normalizeLoadResource = (value: unknown): Load => {
  const source = isRecord(value) ? value : {};
  const meta = isRecord(source.meta) ? source.meta : {};
  const payload = isRecord(source.payload) ? source.payload : {};

  return {
    ...(source as Partial<Load>),
    load_number: source.load_number || meta.load_number || source.internal_id || source.public_id || source.uuid,
    customer_reference: meta.customer_reference,
    total_freight: source.total_freight ?? meta.total_freight,
    advance_amount: source.advance_amount ?? meta.advance_amount,
    balance_amount: source.balance_amount ?? meta.balance_amount,
    eway_bill_number: source.eway_bill_number ?? meta.eway_bill_number,
    origin_location: source.origin_location || payload.pickup,
    destination_location: source.destination_location || payload.dropoff,
    status: source.status || 'created',
  } as Load;
};

const unwrapOrder = (value: unknown): unknown => {
  if (!isRecord(value)) return value;
  return value.order || value.data || value;
};

export const loadApi = {
  list: async (filters: LoadFilters = {}): Promise<PaginatedResponse<Load>> => {
    const res = await apiClient.get('/orders', { params: filters });
    return res.data;
  },

  get: async (id: string): Promise<Load> => {
    const res = await apiClient.get(`/orders/${id}`);
    return normalizeLoadResource(unwrapOrder(res.data));
  },

  create: async (data: Partial<Load>): Promise<Load> => {
    const input = data as LoadInput;
    const explicitConfigUuid = input.order_config_uuid || input.order?.order_config_uuid;
    let orderConfigUuid = explicitConfigUuid;

    if (!orderConfigUuid) {
      const configResponse = await apiClient.get('/orders/default-config');
      orderConfigUuid = getOrderConfigUuid(configResponse.data);
    }

    if (!orderConfigUuid) {
      throw new Error('No default order configuration is available for this company.');
    }

    const res = await apiClient.post(
      '/orders',
      { order: normalizeOrderPayload(input, orderConfigUuid) },
      { timeout: 120000 },
    );

    return normalizeLoadResource(unwrapOrder(res.data));
  },

  update: async (id: string, data: Partial<Load>): Promise<Load> => {
    const res = await apiClient.put(`/orders/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<Load> => {
    const res = await apiClient.patch(`/orders/${id}/status`, { status });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },

  getLoadingSlipPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/orders/${id}/loading-slip-pdf`;
  },

  getTripSheetPdfUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/orders/${id}/trip-sheet-pdf`;
  },
};
