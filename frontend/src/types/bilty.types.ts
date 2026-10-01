import { MaterialItem } from './load.types';

export interface Bilty {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  company_uuid?: string;
  lr_uuid?: string;
  load_uuid?: string;
  vehicle_uuid?: string;
  driver_uuid?: string;
  customer_uuid?: string;
  consignor_uuid?: string;
  consignee_uuid?: string;
  bilty_number: string;
  bilty_date?: string;
  from_location?: string;
  to_location?: string;
  material_details?: MaterialItem[];
  total_weight?: number;

  // Transport details & amounts
  freight_amount?: number;
  total_freight?: number;
  base_freight?: number;
  loading_charges?: number;
  toll_charges?: number;
  advance_amount: number;
  balance_amount: number;
  payment_terms?: 'paid' | 'to_pay' | 'to_be_billed' | string;

  // Indian Regulatory & Copy Details
  gst_rcm?: boolean;
  sac_code?: string;
  status?: string;
  copy_type?: string;

  // Flattened display fields
  lr_number?: any;
  consignor_name?: string;
  consignor_address?: string;
  consignor_gstin?: string;
  consignee_name?: string;
  consignee_address?: string;
  consignee_gstin?: string;
  from_city?: string;
  to_city?: string;
  vehicle_plate_number?: string;
  driver_name?: string;
  goods_description?: string;
  package_type?: string;
  total_packages?: number;
  weight_mt?: number;

  remarks?: string;
  authorized_by?: string;
  created_at?: string;
  updated_at?: string;

  // Relations
  consignor?: {
    uuid: string;
    name: string;
    phone?: string;
    gstin?: string;
    billing_address?: string;
  };
  consignee?: {
    uuid: string;
    name: string;
    phone?: string;
    gstin?: string;
    delivery_address?: string;
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
  };
  order?: {
    uuid: string;
    load_number?: string;
    public_id?: string;
  };
}
