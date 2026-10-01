export interface AdditionalCharge {
  label: string;
  amount: number;
}

export interface FreightCharge {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  company_uuid?: string;
  load_uuid?: string;
  load_id?: string;
  lr_number?: string;
  trip_uuid?: string;
  customer_uuid?: string;
  customer_name?: string;
  route?: string;

  // Breakdown
  base_freight?: number;
  freight_amount?: number;
  loading_charges?: number;
  unloading_charges?: number;
  loading_unloading?: number;
  detention_charges?: number;
  toll_charges?: number;
  handling_charges?: number;
  miscellaneous_charges?: number;
  additional_charges?: AdditionalCharge[];

  // Totals & Balances
  total_charges?: number;
  total_freight: number;
  advance_paid?: number;
  advance_received: number;
  deductions?: number;
  deduction_remarks?: string;
  balance_payable: number;

  payment_status: 'pending' | 'partial' | 'paid' | 'unpaid' | string;
  due_date?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;

  // Relations
  customer?: {
    uuid: string;
    name: string;
    phone?: string;
    gstin?: string;
  };
  order?: {
    uuid: string;
    load_number?: string;
    public_id?: string;
    status?: string;
  };
}

export interface CustomerStatementSummary {
  total_loads: number;
  total_lrs: number;
  total_bilties: number;
  total_freight_billed: number;
  total_advance_paid: number;
  total_deductions: number;
  outstanding_balance: number;
}

export interface CustomerStatementData {
  customer: {
    uuid: string;
    public_id: string;
    name: string;
    phone?: string;
    email?: string;
    gstin?: string;
    pan_number?: string;
    billing_address?: string;
    delivery_address?: string;
    payment_terms?: string;
  };
  period: {
    from_date?: string;
    to_date?: string;
  };
  summary: CustomerStatementSummary;
  transactions: any[];
  loads: any[];
  lrs: any[];
  bilties: any[];
}
