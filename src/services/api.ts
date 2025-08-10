const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import type { Service } from '../types';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  type: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'user' | 'staff' | 'admin';
  isVerified: boolean;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingLimits {
  minDate: string;
  maxDate: string;
  allowOnlineBooking: boolean;
  message: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  yearsOfExperience?: number;
  bio?: string;
  avatar?: string;
  isActive: boolean;
  workingHours?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bookings: number;
    services: number;
  };
  services?: {
    service: {
      id: string;
      name: string;
      category: string;
    };
  }[];
}

export interface StudioSettings {
  id?: string;
  studioName: string;
  studioDescription: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  openingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  bookingSettings: {
    maxAdvanceBookingDays: number;
    minAdvanceBookingHours: number;
    cancellationHours: number;
    allowOnlineBooking: boolean;
    requirePaymentUpfront: boolean;
    sendConfirmationEmail: boolean;
    sendReminderEmail: boolean;
    reminderHours: number;
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    newBookingAlert: boolean;
    cancellationAlert: boolean;
    reminderAlert: boolean;
  };
  themeSettings: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    favicon?: string;
  };
  socialMedia: {
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    youtubeUrl?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  staffId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  service?: Service;
  staff?: Staff;
  // Campi pagamento
  amount?: number;
  isPaid?: boolean;
  paymentDate?: string;
  paymentMethod?: string;
}

export interface CreateBookingData {
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface BookedSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

export interface AvailabilityData {
  date: string;
  staffId: string;
  bookedSlots: BookedSlot[];
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('🚀 API Request:', { url, method: config.method, body: config.body });
      const response = await fetch(url, config);
      console.log('📡 HTTP Response:', { status: response.status, ok: response.ok });
      
      const data = await response.json();
      console.log('📦 Response Data:', data);

      // If the HTTP status indicates an error, throw an exception
      if (!response.ok) {
        console.log('❌ HTTP Error detected, throwing exception');
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Request successful, returning data');
      // Return successful response data
      return data;
    } catch (error) {
      console.error('💥 API request failed:', error);
      // Re-throw the error so it can be caught by the calling code
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: RegisterRequest): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginRequest): Promise<ApiResponse> {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return result;
  }

  async verifyOtp(otpData: VerifyOtpRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(otpData),
    });
  }

  async requestOtp(email: string, type: 'LOGIN' | 'PASSWORD_RESET'): Promise<ApiResponse> {
    return this.request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, type }),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }

  async logout(): Promise<ApiResponse> {
    const result = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
    return result;
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request('/users/profile');
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData: ChangePasswordData): Promise<ApiResponse> {
    return this.request('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Booking endpoints
  async getBookings(): Promise<ApiResponse<Booking[]>> {
    return this.request('/bookings');
  }

  async createBooking(bookingData: CreateBookingData): Promise<ApiResponse<Booking>> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getAvailability(staffId: string, date: string): Promise<ApiResponse<AvailabilityData>> {
    return this.request(`/bookings/availability/${staffId}/${date}`);
  }

  // New availability endpoint that includes staff blocks
  async getAvailabilityWithBlocks(date: string, serviceId: string, staffId: string): Promise<ApiResponse<{
    date: string;
    serviceId: string;
    staffId: string | null;
    serviceDuration: number;
    slots: Array<{ time: string; available: boolean }>;
  }>> {
    return this.request(`/admin/available-slots?date=${date}&serviceId=${serviceId}&staffId=${staffId}`);
  }

  // Service endpoints
  async getServices(): Promise<ApiResponse<Service[]>> {
    return this.request('/services');
  }

  async getStaffByService(serviceId: string): Promise<ApiResponse<Staff[]>> {
    return this.request(`/services/${serviceId}/staff`);
  }

  // Staff endpoints
  async getStaff(): Promise<ApiResponse<Staff[]>> {
    return this.request('/staff');
  }

  async updateBooking(id: string, bookingData: any): Promise<ApiResponse<any>> {
    return this.request(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  }

  async cancelBooking(id: string): Promise<ApiResponse> {
    return this.request(`/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Admin methods
  async getAdminStats(): Promise<ApiResponse> {
    return this.request('/admin/stats');
  }

  async getAdminDetailedStats(): Promise<ApiResponse> {
    return this.request('/admin/detailed-stats');
  }

  async getRecentBookings(limit: number = 10): Promise<ApiResponse> {
    return this.request(`/admin/recent-bookings?limit=${limit}`);
  }

  async getAdminUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    
    const query = queryParams.toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async getAdminBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    serviceId?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.serviceId) queryParams.append('serviceId', params.serviceId);
    
    const query = queryParams.toString();
    return this.request(`/admin/bookings${query ? `?${query}` : ''}`);
  }

  async updateBookingStatus(
    bookingId: string, 
    status: string, 
    notes?: string, 
    paymentInfo?: {
      amount?: number;
      isPaid?: boolean;
      paymentMethod?: string;
    }
  ): Promise<ApiResponse> {
    return this.request(`/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ 
        status, 
        notes,
        ...paymentInfo
      })
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  // Admin Services methods
  async getAdminServices(): Promise<ApiResponse<Service[]>> {
    return this.request('/admin/services');
  }

  async createService(serviceData: {
    name: string;
    description: string;
    duration: number;
    price: number;
    categoryId: string;
    color: string;
    imageUrl?: string;
    isActive: boolean;
  }): Promise<ApiResponse<Service>> {
    return this.request('/admin/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  }

  async updateService(serviceId: string, serviceData: {
    name: string;
    description: string;
    duration: number;
    price: number;
    categoryId: string;
    color: string;
    imageUrl?: string;
    isActive: boolean;
  }): Promise<ApiResponse<Service>> {
    return this.request(`/admin/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    });
  }

  async deleteService(serviceId: string): Promise<ApiResponse> {
    return this.request(`/admin/services/${serviceId}`, {
      method: 'DELETE'
    });
  }

  // Categories methods
  async getCategories(): Promise<ApiResponse<import('../types').Category[]>> {
    return this.request('/categories');
  }

  async getAdminCategories(): Promise<ApiResponse<import('../types').Category[]>> {
    return this.request('/categories/admin');
  }

  async createCategory(categoryData: {
    value: string;
    label: string;
    color: string;
  }): Promise<ApiResponse<import('../types').Category>> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  async updateCategory(categoryId: string, categoryData: {
    value: string;
    label: string;
    color: string;
    isActive?: boolean;
  }): Promise<ApiResponse<import('../types').Category>> {
    return this.request(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  }

  async deleteCategory(categoryId: string): Promise<ApiResponse> {
    return this.request(`/categories/${categoryId}`, {
      method: 'DELETE'
    });
  }

  async toggleServiceStatus(serviceId: string): Promise<ApiResponse<Service>> {
    return this.request(`/admin/services/${serviceId}/toggle`, {
      method: 'PATCH'
    });
  }

  // Admin Staff methods
  async getAdminStaff(): Promise<ApiResponse<Staff[]>> {
    return this.request('/admin/staff');
  }

  async createStaff(staffData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    specialization: string;
    yearsOfExperience?: number;
    bio?: string;
    avatar?: string;
    workingHours?: string;
    isActive: boolean;
  }): Promise<ApiResponse<Staff>> {
    return this.request('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(staffData)
    });
  }

  async updateStaff(staffId: string, staffData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    specialization: string;
    yearsOfExperience?: number;
    bio?: string;
    avatar?: string;
    workingHours?: string;
    isActive: boolean;
  }): Promise<ApiResponse<Staff>> {
    return this.request(`/admin/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(staffData)
    });
  }

  async deleteStaff(staffId: string): Promise<ApiResponse> {
    return this.request(`/admin/staff/${staffId}`, {
      method: 'DELETE'
    });
  }

  async toggleStaffStatus(staffId: string): Promise<ApiResponse<Staff>> {
    return this.request(`/admin/staff/${staffId}/toggle`, {
      method: 'PATCH'
    });
  }

  // Admin Service-Staff relationships methods
  async getServiceStaff(serviceId: string): Promise<ApiResponse<Staff[]>> {
    return this.request(`/admin/services/${serviceId}/staff`);
  }

  async assignStaffToService(serviceId: string, staffId: string): Promise<ApiResponse> {
    return this.request(`/admin/services/${serviceId}/staff/${staffId}`, {
      method: 'POST'
    });
  }

  async removeStaffFromService(serviceId: string, staffId: string): Promise<ApiResponse> {
    return this.request(`/admin/services/${serviceId}/staff/${staffId}`, {
      method: 'DELETE'
    });
  }

  async bulkUpdateServiceStaff(serviceId: string, staffIds: string[]): Promise<ApiResponse> {
    return this.request(`/admin/services/${serviceId}/staff/bulk`, {
      method: 'POST',
      body: JSON.stringify({ staffIds })
    });
  }

  // Admin Settings methods
  async getStudioSettings(): Promise<ApiResponse<StudioSettings>> {
    return this.request('/admin/settings');
  }

  async updateStudioSettings(settings: StudioSettings): Promise<ApiResponse<StudioSettings>> {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Booking Limits methods
  async getBookingLimits(): Promise<ApiResponse<BookingLimits>> {
    return this.request('/bookings/limits');
  }

  // Staff working hours management (keep only this one)
  async getMyWorkingHours(): Promise<ApiResponse<{
    staffId: string;
    firstName: string;
    lastName: string;
    workingHours: any;
  }>> {
    return this.request('/staff/my-working-hours');
  }

  async updateMyWorkingHours(workingHours: any): Promise<ApiResponse<{
    staffId: string;
    firstName: string;
    lastName: string;
    workingHours: any;
  }>> {
    return this.request('/staff/my-working-hours', {
      method: 'PUT',
      body: JSON.stringify({ workingHours })
    });
  }
}

export const apiService = new ApiService();
export default apiService;
