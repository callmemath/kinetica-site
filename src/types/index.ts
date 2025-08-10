export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'user' | 'staff' | 'admin';
  isVerified?: boolean;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Category {
  id: string;
  value: string; // valore interno (es. "fisioterapia")
  label: string; // etichetta visualizzata (es. "Fisioterapia")
  color: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  categoryId: string;
  category?: Category; // Relazione popolata dal backend
  color: string;
  imageUrl?: string; // URL dell'immagine del servizio
  isActive: boolean;
  availability?: string; // JSON string with booking availability schedule
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  bio?: string;
  avatar?: string;
  isActive: boolean;
  workingHours?: string; // JSON string
  services?: Service[]; // Servizi che può erogare
}

export interface Booking {
  id: string;
  userId: string;
  user?: User;
  serviceId: string;
  service?: Service;
  staffId: string;
  staff?: Staff;
  date: Date | string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  
  // Campi per pagamento e importo
  amount?: number; // Importo della prenotazione (può essere diverso dal prezzo del servizio)
  isPaid?: boolean; // Stato del pagamento
  paymentDate?: Date | string; // Data del pagamento
  paymentMethod?: string; // Metodo di pagamento (CASH, CARD, TRANSFER, etc.)
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BookingFormData {
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface AuthUser {
  user: User;
  token: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  bookingId?: string;
}

export interface StaffBlock {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'TRAINING' | 'OTHER';
  reason: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalkInBookingData {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceId: string;
  staffId?: string; // Campo per selezione staff (opzionale per admin)
  date: string;
  startTime: string;
  notes?: string;
}

export interface StaffBlockFormData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'TRAINING' | 'OTHER';
  reason: string;
}

export interface ServiceAvailability {
  [dayOfWeek: string]: {
    enabled: boolean;
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}
