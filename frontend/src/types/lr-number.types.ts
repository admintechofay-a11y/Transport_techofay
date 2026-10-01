export interface LrStatusHistory {
  id?: number | string;
  uuid: string;
  lr_uuid: string;
  status: string;
  notes?: string;
  location?: string;
  created_at: string;
  created_by?: {
    name: string;
  };
}

export interface LrNumber {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  company_uuid?: string;
  load_uuid?: string;
  vehicle_uuid?: string;
  driver_uuid?: string;
  customer_uuid?: string;
  consignor_uuid?: string;
  consignee_uuid?: string;
  bilty_uuid?: string;
  lr_number: string;
  generation_mode?: 'auto' | 'manual';
  status: 'draft' | 'generated' | 'loaded' | 'dispatched' | 'in_transit' | 'partially_delivered' | 'delivered' | 'invoiced' | 'cancelled' | string;
  from_location?: string;
  to_location?: string;
  lr_date?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;

  // Flattened / Display Attributes
  series?: string;
  sequence_number?: number;
  issued_date?: string;
  from_city?: string;
  to_city?: string;
  consignor_name?: string;
  consignor_address?: string;
  consignor_gstin?: string;
  consignee_name?: string;
  consignee_address?: string;
  consignee_gstin?: string;
  vehicle_plate_number?: string;
  driver_name?: string;
  driver_phone?: string;
  total_packages?: number;
  package_type?: string;
  charged_weight?: number;
  actual_weight?: number;
  total_freight?: number;
  advance_amount?: number;
  balance_amount?: number;
  freight_terms?: 'to_pay' | 'paid' | 'to_be_billed' | string;
  eway_bill_number?: string;

  // Relations
  order?: {
    uuid: string;
    public_id?: string;
    load_number?: string;
    status?: string;
  };
  vehicle?: {
    uuid: string;
    plate_number: string;
    name?: string;
  };
  driver?: {
    uuid: string;
    name: string;
    phone?: string;
    drivers_license_number?: string;
    drivers_license_expiry?: string;
  };
  customer?: {
    uuid: string;
    name: string;
    phone?: string;
    gstin?: string;
  };
  consignor?: {
    uuid: string;
    name: string;
    phone?: string;
    gstin?: string;
    address?: string;
  };
  consignee?: {
    uuid: string;
    name: string;
    phone?: string;
    gstin?: string;
    address?: string;
  };
  bilty?: {
    uuid: string;
    bilty_number: string;
    balance_amount?: number;
  };
  status_histories?: LrStatusHistory[];
}
