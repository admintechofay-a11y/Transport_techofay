import { Vehicle } from './vehicle.types';
import { Driver } from './driver.types';
import { LrNumber } from './lr-number.types';
import { Bilty } from './bilty.types';
import { FreightCharge } from './freight.types';

export interface MaterialItem {
  material: string;
  quantity: number | string;
  unit: string;
  weight?: number | string;
  rate?: number | string;
  amount?: number | string;
  remarks?: string;
}

export interface LoadLocation {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  load_uuid?: string;
  sequence?: number;
  location_type?: 'pickup' | 'delivery' | string;
  contact_name?: string;
  contact_phone?: string;
  material_items?: MaterialItem[];
  total_quantity?: number;
  total_weight?: number;
  status?: 'pending' | 'loading' | 'loaded' | 'in_transit' | 'delivered' | 'skipped' | string;
  completed_at?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  name?: string;
  address?: string;
}

export interface LoadParty {
  name: string;
  phone?: string;
  address?: string;
  gstin?: string;
  city?: string;
}

export interface Load {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  load_number?: string;
  internal_id?: string;
  tracking?: string;
  status: 'created' | 'pending' | 'dispatched' | 'vehicle_assigned' | 'loading' | 'in_transit' | 'partially_delivered' | 'delivered' | 'completed' | 'closed' | 'cancelled' | string;
  load_type?: 'FTL' | 'PTL' | 'Container' | 'Parcel' | string;
  service_type?: 'Standard' | 'Express' | 'Dedicated' | string;
  company_uuid?: string;
  customer_uuid?: string;
  facilitator_uuid?: string;
  driver_assigned_uuid?: string;
  vehicle_assigned_uuid?: string;
  from_location?: string;
  to_location?: string;
  scheduled_pickup?: string;
  scheduled_delivery?: string;
  pod_required?: boolean;
  pod_status?: 'pending' | 'uploaded' | 'verified' | string;
  pod_received_by?: string;
  pod_receiver_phone?: string;
  pod_delivery_date?: string;
  pod_remarks?: string;
  pod_url?: string;
  notes?: string;

  // Commercial / Goods summary
  total_freight?: number;
  advance_amount?: number;
  balance_amount?: number;
  total_declared_value?: number;
  eway_bill_number?: string;
  eway_bill_expiry?: string;

  created_at?: string;
  updated_at?: string;

  // Convenient flattened relations
  consignor?: LoadParty;
  consignee?: LoadParty;
  origin_location?: { name: string; address?: string };
  destination_location?: { name: string; address?: string };
  vehicle?: { plate_number: string; make?: string; model?: string };
  driver?: { name: string; phone?: string };
  lr_number?: { lr_number: string; status?: string };
  bilty?: { bilty_number: string };

  // Full relations
  customer?: {
    uuid: string;
    public_id?: string;
    name: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  driver_assigned?: Driver;
  vehicle_assigned?: Vehicle;
  payload?: any;
  locations?: LoadLocation[];
  lr_numbers?: LrNumber[];
  bilties?: Bilty[];
  freight_charge?: FreightCharge;
  proofs?: any[];
}

export interface LoadFilters {
  search?: string;
  status?: string;
  customer_uuid?: string;
  vehicle_uuid?: string;
  driver_uuid?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  page?: number;
}
