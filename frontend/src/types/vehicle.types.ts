export interface VehicleDocument {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  vehicle_uuid?: string;
  document_type: 'rc' | 'insurance' | 'puc' | 'fitness_certificate' | 'permit' | 'national_permit' | 'tax' | 'other' | string;
  document_label?: string;
  document_number?: string;
  issued_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  file_url?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Relations
  vehicle?: {
    uuid: string;
    plate_number: string;
    name?: string;
  };
}

export interface Vehicle {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  plate_number: string;
  name?: string;
  status: 'available' | 'on_trip' | 'under_maintenance' | 'maintenance' | 'inactive' | 'out_of_service' | string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  chassis_number?: string;
  engine_number?: string;
  owner_name?: string;
  owner_type?: 'owner' | 'transporter' | 'leased';
  owner_contact?: string;
  owner_alternate_contact?: string;
  registration_authority?: string;
  registration_date?: string;
  manufacturer?: string;
  vehicle_category?: string;
  vehicle_type?: string;
  capacity_tonnes?: number;
  capacity_tonnage?: number;
  fuel_type?: string;
  odometer_reading?: number;
  gps_tracking_id?: string;
  current_trip_corridor?: string;
  driver_name?: string;
  avatar_url?: string;

  // Quick snapshot dates
  insurance_expiry?: string;
  permit_expiry?: string;
  fitness_expiry?: string;
  puc_expiry?: string;
  national_permit_expiry?: string;
  road_tax_expiry?: string;

  created_at?: string;
  updated_at?: string;

  // Relations
  documents?: VehicleDocument[];
  current_driver?: any;
}
