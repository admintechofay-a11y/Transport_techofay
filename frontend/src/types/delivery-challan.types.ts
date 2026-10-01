import { MaterialItem } from './load.types';

export interface DeliveryChallan {
  id?: number;
  uuid: string;
  public_id: string;
  load_uuid?: string;
  load_location_uuid?: string;
  vehicle_uuid?: string;
  driver_uuid?: string;
  consignee_uuid?: string;
  challan_number: string;
  challan_date?: string;
  material_items?: MaterialItem[];
  total_quantity?: number;
  total_weight?: number;
  status: 'pending' | 'delivered' | 'partial' | 'returned';
  delivered_at?: string;
  received_by?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;

  // Relations
  consignee?: {
    name: string;
    phone?: string;
    delivery_address?: string;
  };
  vehicle?: {
    plate_number: string;
  };
  driver?: {
    name: string;
    phone?: string;
  };
  order?: {
    load_number?: string;
    public_id?: string;
  };
}

export interface GatePass {
  id?: number;
  uuid: string;
  public_id: string;
  load_uuid?: string;
  vehicle_uuid?: string;
  driver_uuid?: string;
  gate_pass_number: string;
  pass_type: 'in' | 'out' | 'both';
  in_time?: string;
  out_time?: string;
  authorized_by?: string;
  security_name?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;

  // Relations
  vehicle?: {
    plate_number: string;
  };
  driver?: {
    name: string;
  };
  order?: {
    load_number?: string;
    public_id?: string;
  };
}
