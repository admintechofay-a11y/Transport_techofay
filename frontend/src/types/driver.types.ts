export interface DriverDocument {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  driver_uuid?: string;
  document_type: 'driving_licence' | 'aadhaar' | 'pan' | 'police_verification' | 'medical_certificate' | 'other' | string;
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
}

export interface Driver {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  name: string;
  phone: string;
  email?: string;
  status: 'available' | 'on_trip' | 'on_leave' | 'inactive' | 'suspended' | string;
  photo_url?: string;

  // Licence & Personal
  drivers_license_number?: string;
  driving_licence_number?: string;
  drivers_license_type?: string;
  licence_type?: string;
  drivers_license_expiry?: string;
  licence_expiry?: string;

  // Transportation Operations
  assigned_vehicle?: string;
  current_corridor?: string;
  experience_years?: number;
  blood_group?: string;

  // Bank for Bhatta & Advance
  bank_account_number?: string;
  bank_ifsc?: string;

  address?: string;
  alternate_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  date_of_birth?: string;
  created_at?: string;
  updated_at?: string;

  // Relations
  current_vehicle?: any;
  documents?: DriverDocument[];
}
