export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
  meta?: {
    pagination?: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  success?: boolean;
}

export interface User {
  id?: number | string;
  uuid?: string;
  public_id?: string;
  name: string;
  email: string;
  phone?: string;
  company_uuid?: string;
  type?: string;
  role?: string;
}

export interface Company {
  uuid: string;
  public_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  currency?: string;
  country?: string;
  gstin?: string;
}
