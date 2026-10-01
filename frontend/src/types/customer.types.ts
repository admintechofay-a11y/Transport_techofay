export interface CustomerParty {
  id: string;
  uuid?: string;
  public_id?: string;
  name: string;
  type?: 'Consignor' | 'Consignee' | 'Corporate' | 'Broker' | string;
  party_type?: 'customer' | 'consignor' | 'consignee' | 'transporter' | 'other' | string;
  city?: string;
  state?: string;
  billing_city?: string;
  billing_state?: string;
  billing_address?: string;
  delivery_address?: string;
  gstin?: string;
  pan?: string;
  pan_number?: string;
  phone: string;
  email?: string;
  contact_person?: string;
  title?: string;
  active_loads_count?: number;
  total_billed?: number;
  total_paid?: number;
  outstanding_balance?: number;
  credit_limit?: number;
  payment_terms?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFilters {
  search?: string;
  party_type?: string;
  type?: string;
  limit?: number;
  page?: number;
}
