import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Settings, 
  BarChart3, 
  DollarSign,
  UserPlus,
  CalendarCheck,
  AlertCircle,
  Wrench,
  CalendarX,
  Plus,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { Service, StaffBlock, WalkInBookingData, StaffBlockFormData } from '../types';
import AnimatedCard from '../components/AnimatedCard';
import LoadingSpinner from '../components/LoadingSpinner';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // States per gestione staff
  const [services, setServices] = useState<Service[]>([]);
  const [staffBlocks, setStaffBlocks] = useState<StaffBlock[]>([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
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
    date: '',
    startTime: '',
    notes: ''
  });

  // Mock data - sostituire con dati reali dall'API
  const stats = {
    totalBookings: 145,
    todayBookings: 8,
    totalUsers: 89,
    revenue: 3420,
    pendingBookings: 12,
    completedBookings: 133
  };

  const recentBookings = [
    { id: '1', patient: 'Mario Rossi', service: 'Fisioterapia', time: '09:30', status: 'confirmed' },
    { id: '2', patient: 'Laura Bianchi', service: 'Osteopatia', time: '11:00', status: 'pending' },
    { id: '3', patient: 'Giuseppe Verde', service: 'Pilates', time: '14:30', status: 'confirmed' },
    { id: '4', patient: 'Anna Neri', service: 'Riabilitazione', time: '16:00', status: 'completed' }
  ];

  // Menu items dinamico basato sul ruolo
  const getMenuItems = () => {
    const baseItems = [
      { id: 'overview', label: 'Panoramica', icon: BarChart3 },
      { id: 'bookings', label: 'Prenotazioni', icon: Calendar },
      { id: 'patients', label: 'Pazienti', icon: Users },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { id: 'staff-services', label: 'Gestione Servizi', icon: Wrench },
        { id: 'staff', label: 'Staff', icon: UserPlus },
        { id: 'settings', label: 'Impostazioni', icon: Settings }
      ];
    } else if (user?.role === 'staff') {
      return [
        ...baseItems,
        { id: 'staff-services', label: 'I miei Servizi', icon: Wrench },
        { id: 'staff-blocks', label: 'Blocchi Orari', icon: CalendarX },
        { id: 'staff-walkin', label: 'Walk-in', icon: UserPlus }
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  // Funzioni API
  const apiCall = async <T,>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> => {
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

  // Carica i servizi
  const loadServices = async () => {
    console.log('AdminDashboard - Loading services...');
    setLoading(true);
    const response = await apiCall<Service[]>('/admin/services');
    console.log('AdminDashboard - Services response:', response);
    if (response.success && response.data) {
      console.log('AdminDashboard - Services data:', response.data);
      console.log('AdminDashboard - First service:', response.data[0]);
      console.log('AdminDashboard - First service category:', response.data[0]?.category);
      setServices(response.data);
    } else {
      setError(response.message || 'Errore nel caricamento dei servizi');
    }
    setLoading(false);
  };

  // Carica i blocchi orari dello staff
  const loadStaffBlocks = async () => {
    setLoading(true);
    const response = await apiCall<StaffBlock[]>('/admin/staff-blocks');
    if (response.success && response.data) {
      setStaffBlocks(response.data);
    } else {
      setError(response.message || 'Errore nel caricamento dei blocchi orari');
    }
    setLoading(false);
  };

  // Crea nuovo blocco orario
  const createStaffBlock = async () => {
    if (!blockFormData.startDate || !blockFormData.endDate || !blockFormData.reason) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    setLoading(true);
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
    setLoading(false);
  };

  // Elimina blocco orario
  const deleteStaffBlock = async (blockId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo blocco orario?')) return;

    setLoading(true);
    const response = await apiCall(`/admin/staff-blocks/${blockId}`, {
      method: 'DELETE',
    });

    if (response.success) {
      setSuccess('Blocco orario eliminato con successo');
      loadStaffBlocks();
    } else {
      setError(response.message || 'Errore nell\'eliminazione del blocco orario');
    }
    setLoading(false);
  };

  // Crea prenotazione walk-in
  const createWalkInBooking = async () => {
    if (!walkInData.clientName || !walkInData.serviceId || !walkInData.date || !walkInData.startTime) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    setLoading(true);
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
        date: '',
        startTime: '',
        notes: ''
      });
    } else {
      setError(response.message || 'Errore nella creazione della prenotazione');
    }
    setLoading(false);
  };

  // Effetti per caricare i dati
  useEffect(() => {
    if (user?.role === 'staff' || user?.role === 'admin') {
      loadServices();
    }
  }, [user]);

  // Ricarica servizi quando si cambia tab a staff-services
  useEffect(() => {
    if (activeTab === 'staff-services' && (user?.role === 'staff' || user?.role === 'admin')) {
      loadServices();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'staff-blocks') {
      loadStaffBlocks();
    }
  }, [activeTab]);

  // Gestione messaggi di successo/errore
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confermata';
      case 'pending': return 'In attesa';
      case 'completed': return 'Completata';
      case 'cancelled': return 'Cancellata';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-max py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard {user?.role === 'admin' ? 'Amministratore' : 'Staff'}
          </h1>
          <p className="text-gray-600">
            Benvenuto, {user?.firstName} {user?.lastName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 hover:translate-x-1 ${
                        activeTab === item.id
                          ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Prenotazioni Oggi</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
                      </div>
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <CalendarCheck className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Totale Pazienti</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fatturato</p>
                        <p className="text-2xl font-bold text-gray-900">€{stats.revenue}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Azioni Rapide per Staff */}
                {user?.role === 'staff' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setActiveTab('staff-services')}
                        className="flex items-center justify-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-300 group"
                      >
                        <Wrench className="w-5 h-5 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="font-medium text-blue-700">Gestione Servizi</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('staff-blocks')}
                        className="flex items-center justify-center space-x-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-300 group"
                      >
                        <CalendarX className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium text-red-700">Blocca Orari</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('staff-walkin')}
                        className="flex items-center justify-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-300 group"
                      >
                        <UserPlus className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium text-green-700">Walk-in</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Prenotazioni Recenti</h2>
                    <button className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors duration-300">
                      Vedi tutte
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{booking.patient}</p>
                            <p className="text-sm text-gray-600">{booking.service}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{booking.time}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Notifiche</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        {stats.pendingBookings} prenotazioni in attesa di conferma
                      </p>
                      <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                        Gestisci
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Backup automatico completato con successo
                      </p>
                      <span className="text-blue-600 text-sm">2 ore fa</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {/* Sezione Servizi Staff/Admin */}
            {activeTab === 'staff-services' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user?.role === 'admin' ? 'Tutti i Servizi' : 'I tuoi Servizi'}
                  </h2>
                  <div className="text-sm text-gray-500">
                    {services.length} servizi disponibili
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Nessun servizio disponibile</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => {
                      console.log('AdminDashboard - Rendering service:', service.name, 'Category:', service.category);
                      return (
                        <AnimatedCard key={service.id} className="p-6 bg-white rounded-xl shadow-sm border">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-gray-900">{service.name}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {service.isActive ? 'Attivo' : 'Inattivo'}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {service.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {service.duration} min
                              </div>
                              <div className="font-semibold text-gray-900">
                                €{service.price}
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-400">
                              Categoria: {service.category?.label || 'N/A'}
                            </div>
                          </div>
                        </AnimatedCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sezione Blocchi Orari Staff */}
            {activeTab === 'staff-blocks' && (
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
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Creazione...' : 'Crea Blocco'}
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
                      <AnimatedCard key={block.id} className="p-6 bg-white rounded-xl shadow-sm border">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
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
                          
                          <button
                            onClick={() => deleteStaffBlock(block.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Elimina blocco"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </AnimatedCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sezione Walk-in Staff */}
            {activeTab === 'staff-walkin' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Prenotazioni dal Vivo</h2>
                </div>

                <AnimatedCard className="p-6 bg-white rounded-xl">
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
                          Servizio *
                        </label>
                        <select
                          value={walkInData.serviceId}
                          onChange={(e) => setWalkInData({...walkInData, serviceId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Seleziona un servizio</option>
                          {services.filter(s => s.isActive).map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} - {service.duration}min - €{service.price}
                            </option>
                          ))}
                        </select>
                      </div>
                      
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
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ora Inizio *
                        </label>
                        <input
                          type="time"
                          value={walkInData.startTime}
                          onChange={(e) => setWalkInData({...walkInData, startTime: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
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
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Creazione...' : 'Crea Prenotazione'}
                      </button>
                    </div>
                  </div>
                </AnimatedCard>
              </div>
            )}

            {(activeTab !== 'overview' && 
              activeTab !== 'staff-services' && 
              activeTab !== 'staff-blocks' && 
              activeTab !== 'staff-walkin') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="mb-4">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sezione {menuItems.find(item => item.id === activeTab)?.label}
                </h3>
                <p className="text-gray-600">
                  Questa sezione è in fase di sviluppo. Sarà disponibile presto!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
