import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Edit,
  Download,
  RefreshCw,
  Info,
  Plus,
  CalendarX,
  Trash2,
  CreditCard
} from 'lucide-react';
import AnimatedCard from '../../components/AnimatedCard';
import BookingDetailsModal from '../../components/admin/BookingDetailsModal';
import StaffBlockModal from '../../components/admin/StaffBlockModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import apiService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../utils/roles';
import { isServiceAvailable, calculateEndTime } from '../../utils/serviceAvailability';
import type { Service, Staff, StaffBlock, WalkInBookingData, StaffBlockFormData, Category } from '../../types';

interface BackendBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  amount?: number;
  isPaid?: boolean;
  paymentDate?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  service: {
    name: string;
    price?: number;
    duration: number;
  };
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    user: {
      email: string;
    };
  };
}

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  service: string;
  date: string;
  time: string;
  therapist: string;
  staffId: string;
  staffEmail: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
  
  // Nuovi campi per pagamento
  amount?: number;
  isPaid?: boolean;
  paymentDate?: string;
  paymentMethod?: string;
}

const AdminBookingsPage = () => {
  const { user, token, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'walkin' | 'blocks'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Stati per nuove funzionalità
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [availableStaffForService, setAvailableStaffForService] = useState<Staff[]>([]);
  const [staffBlocks, setStaffBlocks] = useState<StaffBlock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<StaffBlock | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<StaffBlock | null>(null);
  const [blockModalMode, setBlockModalMode] = useState<'view' | 'edit'>('view');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  
  const [blockFormData, setBlockFormData] = useState<StaffBlockFormData>({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    type: 'VACATION',
    reason: ''
  });
  
  const [walkInData, setWalkInData] = useState<WalkInBookingData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceId: '',
    staffId: '',
    date: '',
    startTime: '',
    notes: ''
  });

  // Stati per gestione orari disponibili  
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  const [slotsAvailability, setSlotsAvailability] = useState<Record<string, boolean>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Funzioni API per nuove funzionalità
  const apiCall = async <T,>(endpoint: string, options: RequestInit = {}): Promise<{success: boolean; data?: T; message?: string}> => {
    try {
      const response = await fetch(`http://localhost:3001/api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('API Error:', err);
      return { success: false, message: 'Errore di connessione al server' };
    }
  };

  // Carica i servizi disponibili per lo staff corrente
  const loadAvailableServices = async () => {
    try {
      console.log('=== LOADING SERVICES FOR CURRENT STAFF ===');
      console.log('Loading services...');
      console.log('User role:', user?.role);
      console.log('User ID:', user?.id);
      console.log('Token available:', !!token);
      
      // Verifica autenticazione prima di procedere
      if (!user || !token) {
        console.error('User not authenticated - skipping service loading');
        setError('Utente non autenticato');
        return;
      }

      // Se l'utente è admin, carica tutti i servizi disponibili
      if (isAdmin(user)) {
        console.log('User is admin - loading all services');
        const servicesResponse = await apiCall<any[]>('/admin/services');
        console.log('Admin services response:', servicesResponse);
        
        if (servicesResponse.success && servicesResponse.data) {
          setAvailableServices(servicesResponse.data);
          console.log('All services loaded for admin:', servicesResponse.data.length, 'services');
        } else {
          console.error('Failed to load services for admin:', servicesResponse.message || 'No message');
          setError('Errore nel caricamento dei servizi');
          setAvailableServices([]);
        }
        return;
      }
      
      console.log('About to call apiCall for staff services...');
      // Prima troviamo lo staff profile dell'utente corrente
      const staffResponse = await apiCall<any[]>('/admin/staff');
      console.log('Staff response:', staffResponse);
      
      if (staffResponse.success && staffResponse.data) {
        // Trova lo staff corrente basato sull'userId
        const currentStaff = staffResponse.data.find((staff: any) => staff.userId === user.id);
        console.log('Current staff found:', currentStaff);
        
        if (currentStaff && currentStaff.services && currentStaff.services.length > 0) {
          // Prendi solo i servizi di questo staff
          const staffServices = currentStaff.services.map((serviceStaff: any) => serviceStaff.service);
          setAvailableServices(staffServices);
          setCurrentStaffId(currentStaff.id); // Salva lo staffId per i controlli di disponibilità
          console.log('Services loaded successfully for current staff:', staffServices.length, 'services');
          console.log('Current staff ID:', currentStaff.id);
          console.log('Services structure:', staffServices);
          console.log('First service:', staffServices[0]);
        } else {
          // Se lo staff non ha servizi assegnati, non può creare prenotazioni walk-in
          console.log('Staff has no services assigned');
          setAvailableServices([]);
          setError('Non hai servizi assegnati. Contatta l\'amministratore per assegnare i servizi al tuo profilo.');
        }
      } else {
        console.error('Failed to load staff data:', staffResponse.message || 'No message');
        setError('Errore nel caricamento del profilo staff');
        setAvailableServices([]);
      }
    } catch (error) {
      console.error('Error loading services (catch block):', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      setError('Errore nel caricamento dei servizi');
      setAvailableServices([]);
    }
  };

  // Carica lo staff disponibile (rimossa - non più necessaria)

  // Carica lo staff disponibile per un servizio specifico
  const loadStaffForService = async (serviceId: string) => {
    try {
      console.log('=== LOADING STAFF FOR SERVICE ===');
      console.log('Service ID:', serviceId);
      
      if (!serviceId) {
        setAvailableStaffForService([]);
        return;
      }

      const response = await apiCall<Staff[]>(`/admin/services/${serviceId}/staff`);
      console.log('Staff for service response:', response);
      
      if (response.success && response.data) {
        setAvailableStaffForService(response.data);
        console.log('Staff loaded for service:', response.data.length, 'staff members');
        
        // Se c'è solo uno staff disponibile e non ne è già stato selezionato uno, selezionalo automaticamente
        if (response.data.length === 1 && !walkInData.staffId) {
          setWalkInData(prev => ({ ...prev, staffId: response.data![0].id }));
        }
        // Se lo staff attualmente selezionato non è più valido per questo servizio, reset
        else if (walkInData.staffId && !response.data.find(staff => staff.id === walkInData.staffId)) {
          setWalkInData(prev => ({ ...prev, staffId: '' }));
        }
      } else {
        console.error('Failed to load staff for service:', response.message || 'No message');
        setAvailableStaffForService([]);
        setWalkInData(prev => ({ ...prev, staffId: '' }));
      }
    } catch (error) {
      console.error('Error loading staff for service:', error);
      setAvailableStaffForService([]);
      setWalkInData(prev => ({ ...prev, staffId: '' }));
    }
  };

  // Carica i blocchi orari dello staff
  const loadStaffBlocks = async () => {
    const response = await apiCall<StaffBlock[]>('/admin/staff-blocks');
    if (response.success && response.data) {
      setStaffBlocks(response.data);
    }
  };

  // Carica la disponibilità degli orari
  const loadSlotsAvailability = async (date: string, serviceId: string, staffId?: string) => {
    try {
      setLoadingSlots(true);
      console.log('=== LOADING SLOTS AVAILABILITY ===');
      console.log('Loading slots availability for:', { date, serviceId, staffId });
      
      const params = new URLSearchParams({
        date,
        serviceId,
        ...(staffId && { staffId })
      });
      
      console.log('API URL params:', params.toString());
      console.log('Full API URL:', `/admin/available-slots?${params}`);
      
      const response = await apiCall<{
        date: string;
        serviceId: string;
        staffId: string | null;
        serviceDuration: number;
        slots: Array<{ time: string; available: boolean }>;
      }>(`/admin/available-slots?${params}`);
      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        console.log('Slots availability loaded:', response.data);
        const availability: Record<string, boolean> = {};
        response.data.slots.forEach(slot => {
          availability[slot.time] = slot.available;
        });
        setSlotsAvailability(availability);
        console.log('Final availability object:', availability);
      } else {
        console.error('Failed to load slots availability:', response.message);
        // In caso di errore, considera tutti gli slot come disponibili
        const availability: Record<string, boolean> = {};
        timeSlots.forEach(slot => {
          availability[slot] = true;
        });
        setSlotsAvailability(availability);
      }
    } catch (error) {
      console.error('Error loading slots availability:', error);
      // In caso di errore, considera tutti gli slot come disponibili
      const availability: Record<string, boolean> = {};
      timeSlots.forEach(slot => {
        availability[slot] = true;
      });
      setSlotsAvailability(availability);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Crea nuovo blocco orario
  const createStaffBlock = async () => {
    if (!blockFormData.startDate || !blockFormData.endDate || !blockFormData.reason) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    const response = await apiCall<StaffBlock>('/admin/staff-blocks', {
      method: 'POST',
      body: JSON.stringify(blockFormData),
    });

    if (response.success) {
      setSuccess('Blocco orario creato con successo');
      setShowBlockForm(false);
      setBlockFormData({
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        type: 'VACATION',
        reason: ''
      });
      loadStaffBlocks();
    } else {
      setError(response.message || 'Errore nella creazione del blocco orario');
    }
  };

  // Elimina blocco orario
  const deleteStaffBlock = async (blockId: string) => {
    const response = await apiCall(`/admin/staff-blocks/${blockId}`, {
      method: 'DELETE',
    });

    if (response.success) {
      setSuccess('Blocco orario eliminato con successo');
      loadStaffBlocks();
    } else {
      throw new Error(response.message || 'Errore nell\'eliminazione del blocco orario');
    }
  };

  // Gestisce l'eliminazione confermata dal modal
  const handleConfirmDelete = async () => {
    if (!blockToDelete) return;
    
    try {
      await deleteStaffBlock(blockToDelete.id);
      setBlockToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione del blocco orario');
    }
  };

  // Aggiorna blocco orario
  const updateStaffBlock = async (blockId: string, data: StaffBlockFormData) => {
    const response = await apiCall(`/admin/staff-blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response.success) {
      setSuccess('Blocco orario aggiornato con successo');
      loadStaffBlocks();
    } else {
      throw new Error(response.message || 'Errore nell\'aggiornamento del blocco orario');
    }
  };

  // Apri modal blocco per visualizzazione
  const openBlockModal = (block: StaffBlock, mode: 'view' | 'edit' = 'view') => {
    setSelectedBlock(block);
    setBlockModalMode(mode);
  };

  // Chiudi modal blocco
  const closeBlockModal = () => {
    setSelectedBlock(null);
    setBlockModalMode('view');
  };

  // Crea prenotazione walk-in
  const createWalkInBooking = async () => {
    if (!walkInData.clientName || !walkInData.serviceId || !walkInData.date || !walkInData.startTime) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    // Per gli admin, richiedi la selezione dello staff
    if (isAdmin(user) && !walkInData.staffId) {
      setError('Seleziona uno staff per la prenotazione');
      return;
    }

    // Trova il servizio selezionato per verificare la disponibilità
    const selectedService = availableServices.find(s => s.id === walkInData.serviceId);
    if (selectedService) {
      // Calcola l'orario di fine basato sulla durata del servizio
      const endTime = calculateEndTime(walkInData.startTime, selectedService.duration);
      
      // Verifica se il servizio è disponibile per l'orario selezionato
      const serviceAvailable = isServiceAvailable(
        selectedService.availability,
        walkInData.date,
        walkInData.startTime,
        endTime
      );

      if (!serviceAvailable) {
        setError(`Il servizio "${selectedService.name}" non è disponibile per prenotazioni in questo giorno e orario. Controlla la configurazione di disponibilità del servizio.`);
        return;
      }
    }

    const response = await apiCall('/admin/walk-in-booking', {
      method: 'POST',
      body: JSON.stringify(walkInData),
    });

    if (response.success) {
      setSuccess('Prenotazione creata con successo');
      setWalkInData({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        serviceId: '',
        staffId: '',
        date: '',
        startTime: '',
        notes: ''
      });
      // Ricarica le prenotazioni per vedere la nuova
      loadBookings();
    } else {
      setError(response.message || 'Errore nella creazione della prenotazione');
    }
  };

  // Funzioni helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getBlockTypeLabel = (type: string) => {
    const types = {
      VACATION: 'Vacanza',
      SICK_LEAVE: 'Malattia',
      TRAINING: 'Formazione',
      OTHER: 'Altro'
    };
    return types[type as keyof typeof types] || type;
  };

  const getBlockTypeColor = (type: string) => {
    const colors = {
      VACATION: 'bg-blue-100 text-blue-800',
      SICK_LEAVE: 'bg-red-100 text-red-800',
      TRAINING: 'bg-green-100 text-green-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Funzione per trasformare i dati dal backend al formato frontend
  const transformBookingData = (backendBooking: BackendBooking): Booking => ({
    id: backendBooking.id,
    clientName: `${backendBooking.user.firstName} ${backendBooking.user.lastName}`,
    clientEmail: backendBooking.user.email,
    clientPhone: backendBooking.user.phone,
    service: backendBooking.service.name,
    date: backendBooking.date,
    time: backendBooking.startTime,
    therapist: `${backendBooking.staff.firstName} ${backendBooking.staff.lastName}`,
    staffId: backendBooking.staff.id,
    staffEmail: backendBooking.staff.user.email,
    status: backendBooking.status,
    notes: backendBooking.notes,
    price: backendBooking.service.price,
    createdAt: backendBooking.createdAt,
    updatedAt: backendBooking.updatedAt,
    // Campi pagamento
    amount: backendBooking.amount,
    isPaid: backendBooking.isPaid,
    paymentDate: backendBooking.paymentDate,
    paymentMethod: backendBooking.paymentMethod,
  });

  // Funzione per controllare se l'utente può modificare una prenotazione
  const canModifyBooking = (booking: Booking) => {
    if (!user) return false;
    
    // Admin può modificare qualsiasi prenotazione
    if (isAdmin(user)) return true;
    
    // Staff può modificare solo le proprie prenotazioni
    if (user.role?.toLowerCase() === 'staff') {
      return booking.staffEmail === user.email;
    }
    
    return false;
  };

  const loadCategories = async () => {
    try {
      const response = await apiService.getAdminCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const services = categories.map(cat => cat.label);

  useEffect(() => {
    loadBookings();
    loadCategories();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, dateFilter, serviceFilter, paymentFilter, user]);

  // Nuovi useEffect per funzionalità aggiuntive
  useEffect(() => {
    console.log('AdminBookingsPage useEffect - loading services...');
    // Solo se autenticato
    if (user && token) {
      loadAvailableServices();
    }
  }, [user, token]);

  useEffect(() => {
    if (activeTab === 'blocks') {
      loadStaffBlocks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Carica disponibilità orari quando cambiano data e servizio
  useEffect(() => {
    const selectedStaffId = isAdmin(user) ? walkInData.staffId : currentStaffId;
    
    if (walkInData.date && walkInData.serviceId && selectedStaffId) {
      // Passa lo staffId per controllare i suoi blocchi orari
      loadSlotsAvailability(walkInData.date, walkInData.serviceId, selectedStaffId);
    } else {
      // Reset availability se non ci sono data, servizio o staffId
      setSlotsAvailability({});
    }
  }, [walkInData.date, walkInData.serviceId, walkInData.staffId, currentStaffId, user]);

  // Carica staff quando cambia il servizio (solo per admin)
  useEffect(() => {
    if (isAdmin(user) && walkInData.serviceId) {
      loadStaffForService(walkInData.serviceId);
    }
  }, [walkInData.serviceId, user]);

  const loadBookings = async () => {
    try {
      setIsDataLoading(true);
      const response = await apiService.getAdminBookings();
      if (response.success && response.data) {
        // La risposta ha una struttura { bookings: [...], pagination: {...} }
        if (Array.isArray(response.data.bookings)) {
          const transformedBookings = response.data.bookings.map(transformBookingData);
          setBookings(transformedBookings);
        } else if (Array.isArray(response.data)) {
          // Fallback se la risposta è direttamente un array
          const transformedBookings = response.data.map(transformBookingData);
          setBookings(transformedBookings);
        } else {
          console.warn('Response data structure unexpected:', response.data);
          setBookings([]);
        }
      } else {
        console.warn('Response not successful:', response);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]); // Set empty array on error
    } finally {
      setIsDataLoading(false);
    }
  };

  const refreshBookings = async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  };

  const filterBookings = () => {
    // Protezione: verifica che bookings sia un array
    if (!Array.isArray(bookings)) {
      setFilteredBookings([]);
      return;
    }

    let filtered = [...bookings];

    // Staff filter: mostra solo le prenotazioni del terapista loggato
    if (user && user.role?.toLowerCase() === 'staff') {
      filtered = filtered.filter(booking => booking.staffEmail === user.email);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.clientName.toLowerCase().includes(search) ||
        booking.clientEmail.toLowerCase().includes(search) ||
        booking.service.toLowerCase().includes(search) ||
        booking.therapist.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Service filter
    if (serviceFilter !== 'ALL') {
      filtered = filtered.filter(booking => booking.service === serviceFilter);
    }

    // Payment filter
    if (paymentFilter !== 'ALL') {
      if (paymentFilter === 'PAID') {
        filtered = filtered.filter(booking => booking.isPaid === true);
      } else if (paymentFilter === 'UNPAID') {
        filtered = filtered.filter(booking => booking.isPaid !== true);
      }
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const today = new Date();
      
      switch (dateFilter) {
        case 'TODAY':
          filtered = filtered.filter(booking => {
            const bDate = new Date(booking.date);
            return bDate.toDateString() === today.toDateString();
          });
          break;
        case 'WEEK':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(booking => {
            const bDate = new Date(booking.date);
            return bDate >= today && bDate <= weekFromNow;
          });
          break;
        case 'MONTH':
          const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
          filtered = filtered.filter(booking => {
            const bDate = new Date(booking.date);
            return bDate >= today && bDate <= monthFromNow;
          });
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredBookings(filtered);
  };

  const handleBookingStatusUpdate = async (bookingId: string, status: string, updates: {
    notes?: string;
    amount?: number;
    isPaid?: boolean;
    paymentMethod?: string;
  }) => {
    try {
      const response = await apiService.updateBookingStatus(bookingId, status, updates.notes, {
        amount: updates.amount,
        isPaid: updates.isPaid,
        paymentMethod: updates.paymentMethod
      });
      if (response.success) {
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { 
                ...booking, 
                status: status as any, 
                notes: updates.notes || booking.notes,
                amount: updates.amount !== undefined ? updates.amount : booking.amount,
                isPaid: updates.isPaid !== undefined ? updates.isPaid : booking.isPaid,
                paymentMethod: updates.paymentMethod || booking.paymentMethod,
                paymentDate: updates.isPaid ? new Date().toISOString() : booking.paymentDate
              }
            : booking
        ));
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confermata';
      case 'PENDING': return 'In Attesa';
      case 'COMPLETED': return 'Completata';
      case 'CANCELLED': return 'Cancellata';
      default: return status;
    }
  };

  const exportBookings = () => {
    const csvContent = [
      ['Nome Cliente', 'Email', 'Telefono', 'Servizio', 'Data', 'Ora', 'Terapista', 'Stato', 'Note'],
      ...filteredBookings.map(booking => [
        booking.clientName,
        booking.clientEmail,
        booking.clientPhone || '',
        booking.service,
        new Date(booking.date).toLocaleDateString('it-IT'),
        booking.time,
        booking.therapist,
        getStatusLabel(booking.status),
        booking.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prenotazioni_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Se l'autenticazione è in corso, mostra il loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  // Se non è autenticato (e non stiamo più caricando), mostra la pagina di login
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accesso Richiesto</h2>
          <p className="text-gray-600 mb-6">Devi effettuare il login per accedere a questa pagina.</p>
          <Link
            to="/login"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Vai al Login
          </Link>
        </div>
      </div>
    );
  }

  // Se i dati sono in caricamento, mostra il loader
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento prenotazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
            <div className="container-max px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link
                    to="/admin/dashboard"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-white" />
                  </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Gestione Prenotazioni
                </h1>
                <p className="text-primary-100">
                  {filteredBookings.length} di {bookings.length} prenotazioni
                </p>
                {user?.role?.toLowerCase() === 'staff' && (
                  <div className="flex items-center mt-2 text-primary-100 text-sm">
                    <Info className="w-4 h-4 mr-2" />
                    <span>Visualizzi solo le tue prenotazioni</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshBookings}
                disabled={isRefreshing}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Aggiorna</span>
              </button>
              <button
                onClick={exportBookings}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Esporta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-primary-500/20">
          <div className="container-max px-4">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'bookings'
                    ? 'border-white text-white'
                    : 'border-transparent text-primary-200 hover:text-white hover:border-primary-300'
                }`}
              >
                Prenotazioni
              </button>
              
              <button
                onClick={() => setActiveTab('walkin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'walkin'
                    ? 'border-white text-white'
                    : 'border-transparent text-primary-200 hover:text-white hover:border-primary-300'
                }`}
              >
                Walk-in
              </button>
              
              <button
                onClick={() => setActiveTab('blocks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'blocks'
                    ? 'border-white text-white'
                    : 'border-transparent text-primary-200 hover:text-white hover:border-primary-300'
                }`}
              >
                Blocchi Orari
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="container-max px-4 py-8">
        {/* Messaggi di successo/errore */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Tab Content - Prenotazioni */}
        {activeTab === 'bookings' && (
          <>
            {/* Filters */}
      <div className="container-max px-4 py-6">
        <AnimatedCard delay={100}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca cliente, email, servizio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">Tutti gli stati</option>
                  <option value="PENDING">In Attesa</option>
                  <option value="CONFIRMED">Confermata</option>
                  <option value="COMPLETED">Completata</option>
                  <option value="CANCELLED">Cancellata</option>
                </select>
              </div>

              {/* Service Filter */}
              <div>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="ALL">Tutti i servizi</option>
                  {services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">Tutte le date</option>
                  <option value="TODAY">Oggi</option>
                  <option value="WEEK">Prossima settimana</option>
                  <option value="MONTH">Prossimo mese</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">Tutti i pagamenti</option>
                  <option value="PAID">Solo pagati</option>
                  <option value="UNPAID">Non pagati</option>
                </select>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
          {[
            { 
              label: 'Totale Prenotazioni', 
              value: filteredBookings.length, 
              icon: Calendar, 
              color: 'text-blue-600', 
              bgColor: 'bg-blue-100' 
            },
            { 
              label: 'In Attesa', 
              value: filteredBookings.filter(b => b.status === 'PENDING').length, 
              icon: Clock, 
              color: 'text-yellow-600', 
              bgColor: 'bg-yellow-100' 
            },
            { 
              label: 'Confermate', 
              value: filteredBookings.filter(b => b.status === 'CONFIRMED').length, 
              icon: CheckCircle, 
              color: 'text-green-600', 
              bgColor: 'bg-green-100' 
            },
            { 
              label: 'Completate', 
              value: filteredBookings.filter(b => b.status === 'COMPLETED').length, 
              icon: Users, 
              color: 'text-blue-600', 
              bgColor: 'bg-blue-100' 
            }
          ].map((stat, index) => (
            <AnimatedCard key={stat.label} delay={200 + index * 100}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        {/* Bookings Table */}
        <AnimatedCard delay={600}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Prenotazioni ({filteredBookings.length})
              </h3>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nessuna prenotazione trovata</p>
                <p className="text-sm text-gray-500">Prova a modificare i filtri di ricerca</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servizio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data & Ora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Terapista
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.clientName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.clientEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.service}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(booking.date).toLocaleDateString('it-IT')}
                            </div>
                            <div className="text-sm text-gray-500">{booking.time}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.therapist}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{getStatusLabel(booking.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                €{booking.amount || booking.price || 0}
                              </span>
                              {booking.isPaid ? (
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">Pagato</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <CreditCard className="w-4 h-4 text-orange-600" />
                                  <span className="text-xs text-orange-600 font-medium">Non pagato</span>
                                </div>
                              )}
                            </div>
                            {booking.isPaid && booking.paymentDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(booking.paymentDate).toLocaleDateString('it-IT')}
                                {booking.paymentMethod && (
                                  <span className="ml-1 bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
                                    {booking.paymentMethod === 'CASH' ? 'Contanti' :
                                     booking.paymentMethod === 'CARD' ? 'Carta' :
                                     booking.paymentMethod === 'TRANSFER' ? 'Bonifico' :
                                     booking.paymentMethod}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                              title="Visualizza dettagli"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canModifyBooking(booking) && (
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                                title="Modifica prenotazione"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>
          </>
        )}

      {/* Tab Content - Walk-in */}
      {activeTab === 'walkin' && (
        <div className="space-y-6">
          <AnimatedCard className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Crea Prenotazione Walk-in</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Cliente *
                  </label>
                  <input
                    type="text"
                    value={walkInData.clientName}
                    onChange={(e) => setWalkInData({...walkInData, clientName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome e cognome del cliente"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={walkInData.clientPhone}
                    onChange={(e) => setWalkInData({...walkInData, clientPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+39 123 456 7890"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={walkInData.clientEmail}
                    onChange={(e) => setWalkInData({...walkInData, clientEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="cliente@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servizio * {availableServices.length > 0 && `(${availableServices.length} disponibili)`}
                  </label>
                  <select
                    value={walkInData.serviceId}
                    onChange={(e) => setWalkInData({
                      ...walkInData, 
                      serviceId: e.target.value,
                      staffId: '' // Reset staffId quando cambia il servizio
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">
                      {availableServices.length === 0 ? 'Caricamento servizi...' : 'Seleziona un servizio'}
                    </option>
                    {availableServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} {service.category && `(${service.category})`}
                      </option>
                    ))}
                  </select>
                  {availableServices.length === 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      {error || 'Nessun servizio assegnato al tuo profilo. Contatta l\'amministratore.'}
                    </p>
                  )}
                </div>

                {/* Selezione Staff (solo per admin) */}
                {isAdmin(user) && walkInData.serviceId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff * {availableStaffForService.length > 0 && `(${availableStaffForService.length} disponibili)`}
                    </label>
                    <select
                      value={walkInData.staffId || ''}
                      onChange={(e) => setWalkInData({
                        ...walkInData, 
                        staffId: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">
                        {availableStaffForService.length === 0 ? 'Caricamento staff...' : 'Seleziona staff'}
                      </option>
                      {availableStaffForService.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                    {availableStaffForService.length === 0 && walkInData.serviceId && (
                      <p className="text-sm text-orange-600 mt-1">
                        Nessuno staff disponibile per questo servizio.
                      </p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={walkInData.date}
                    onChange={(e) => setWalkInData({...walkInData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ora Inizio *
                  </label>
                  {walkInData.serviceId && walkInData.date ? (
                    <div className="space-y-3">
                      {loadingSlots && (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                          <span className="text-sm text-gray-600">Controllo disponibilità...</span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {timeSlots.map((time) => {
                          const isAvailable = slotsAvailability[time] !== false; // Default a true se non ancora caricato
                          const isSelected = walkInData.startTime === time;
                          
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setWalkInData({...walkInData, startTime: time})}
                              className={`p-2 text-sm rounded-lg border transition-all duration-200 ${
                                !isAvailable
                                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                  : isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                              }`}
                              title={!isAvailable ? 'Orario non disponibile' : `Prenota alle ${time}`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                      
                      {Object.keys(slotsAvailability).length > 0 && (
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                            <span>Disponibile</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded opacity-50"></div>
                            <span>Non disponibile</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-blue-600 rounded"></div>
                            <span>Selezionato</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-center">
                        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          {!walkInData.serviceId ? 'Seleziona prima un servizio' : 'Seleziona prima una data'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    value={walkInData.notes}
                    onChange={(e) => setWalkInData({...walkInData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Note aggiuntive per la prenotazione..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={createWalkInBooking}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Crea Prenotazione
                </button>
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* Tab Content - Blocchi Orari */}
      {activeTab === 'blocks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Blocchi Orari</h2>
            <button
              onClick={() => setShowBlockForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Blocco
            </button>
          </div>

          {showBlockForm && (
            <AnimatedCard className="p-6 border-blue-200 bg-white rounded-xl shadow-sm border">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Crea Nuovo Blocco Orario</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Inizio *
                    </label>
                    <input
                      type="date"
                      value={blockFormData.startDate}
                      onChange={(e) => setBlockFormData({...blockFormData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Fine *
                    </label>
                    <input
                      type="date"
                      value={blockFormData.endDate}
                      onChange={(e) => setBlockFormData({...blockFormData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ora Inizio
                    </label>
                    <input
                      type="time"
                      value={blockFormData.startTime}
                      onChange={(e) => setBlockFormData({...blockFormData, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ora Fine
                    </label>
                    <input
                      type="time"
                      value={blockFormData.endTime}
                      onChange={(e) => setBlockFormData({...blockFormData, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      value={blockFormData.type}
                      onChange={(e) => setBlockFormData({...blockFormData, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="VACATION">Vacanza</option>
                      <option value="SICK_LEAVE">Malattia</option>
                      <option value="TRAINING">Formazione</option>
                      <option value="OTHER">Altro</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo *
                    </label>
                    <textarea
                      value={blockFormData.reason}
                      onChange={(e) => setBlockFormData({...blockFormData, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Descrivi il motivo del blocco orario..."
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBlockForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={createStaffBlock}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crea Blocco
                  </button>
                </div>
              </div>
            </AnimatedCard>
          )}

          {staffBlocks.length === 0 ? (
            <div className="text-center py-8">
              <CalendarX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nessun blocco orario creato</p>
              <p className="text-sm text-gray-400 mt-2">
                Crea un blocco per indicare i tuoi periodi di assenza
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {staffBlocks.map((block) => (
                <AnimatedCard key={block.id} className="p-6 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBlockTypeColor(block.type)}`}>
                          {getBlockTypeLabel(block.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(block.startDate)} - {formatDate(block.endDate)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatTime(block.startTime)} - {formatTime(block.endTime)}
                        </span>
                      </div>
                      <p className="text-gray-700">{block.reason}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => openBlockModal(block, 'view')}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        title="Visualizza dettagli"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => openBlockModal(block, 'edit')}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                        title="Modifica blocco"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => setBlockToDelete(block)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Elimina blocco"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={handleBookingStatusUpdate}
          canModify={canModifyBooking(selectedBooking)}
        />
      )}

      {/* Staff Block Modal */}
      {selectedBlock && (
        <StaffBlockModal
          block={selectedBlock}
          isOpen={!!selectedBlock}
          onClose={closeBlockModal}
          onUpdate={updateStaffBlock}
          onDelete={deleteStaffBlock}
          mode={blockModalMode}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!blockToDelete}
        onClose={() => setBlockToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Elimina Blocco Orario"
        message="Sei sicuro di voler eliminare questo blocco orario?"
        itemName={blockToDelete ? `${blockToDelete.reason} (${new Date(blockToDelete.startDate).toLocaleDateString('it-IT')} - ${new Date(blockToDelete.endDate).toLocaleDateString('it-IT')})` : undefined}
      />
    </div>
  );
};

export default AdminBookingsPage;
