export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BookingData {
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface ServiceData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  categoryId: string;
  isActive?: boolean;
}

export interface StaffData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  isActive?: boolean;
}

export interface CategoryData {
  name: string;
  description?: string;
  isActive?: boolean;
}
