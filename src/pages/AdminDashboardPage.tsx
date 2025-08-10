import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Settings, 
  BarChart3,
  Clock, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  Activity,
  UserPlus,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Filter,
  CreditCard,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../contexts/ToastContext';
import { isAdminOrStaff, isAdmin, getRoleDisplayName } from '../utils/roles';
import AnimatedCard from '../components/AnimatedCard';
import SimpleCounter from '../components/SimpleCounter';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import BookingDetailsModal from '../components/admin/BookingDetailsModal';
import UserDetailsModal from '../components/admin/UserDetailsModal';
import StatsModal from '../components/admin/StatsModal';

interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  revenue: number;
  completedBookings: number;
}

interface RecentBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  service: string;
  date: string;
  time: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  therapist: string;
  staffId: string;
  staffEmail: string;
  price?: number;
  notes?: string;
  createdAt: string;
  // Campi pagamento
  amount?: number;
  isPaid?: boolean;
  paymentDate?: string;
  paymentMethod?: string;
}

const AdminDashboardPage = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBookings: 0,
    todayBookings: 0,
    pendingBookings: 0,
    revenue: 0,
    completedBookings: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<RecentBooking | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  // Combined effect for permission check and data loading
  useEffect(() => {
    // Non fare redirect se stiamo ancora caricando i dati dell'utente
    if (authLoading) return;
    
    // Check if user has admin/staff permissions
    if (user && !isAdminOrStaff(user)) {
      showError('Accesso negato', 'Non hai i permessi per accedere a questa sezione');
      navigate('/dashboard');
      return;
    }

    // If user has permissions, load admin data
    if (user && isAdminOrStaff(user)) {
      const loadAdminData = async () => {
        setIsLoading(true);
        try {
          // Fetch admin stats
          const statsResponse = await apiService.getAdminStats();
          if (statsResponse.success) {
            setStats(statsResponse.data);
          } else {
            showError('Errore nel caricamento delle statistiche');
            // Fallback to mock data in development
            if (import.meta.env.DEV) {
              setStats({
                totalUsers: 156,
                totalBookings: 423,
                todayBookings: 12,
                pendingBookings: 8,
                revenue: 12450,
                completedBookings: 387
              });
            }
          }

          // Fetch recent bookings
          const bookingsResponse = await apiService.getRecentBookings(10);
          if (bookingsResponse.success) {
            let recentBookingsData = bookingsResponse.data;
            
            // Filtro client-side aggiuntivo per staff (sicurezza extra)
            if (user && user.role?.toLowerCase() === 'staff') {
              recentBookingsData = recentBookingsData.filter((booking: RecentBooking) => 
                booking.staffEmail === user.email
              );
            }
            
            setRecentBookings(recentBookingsData);
          } else {
            showError('Errore nel caricamento delle prenotazioni recenti');
            // Fallback to mock data in development
            if (import.meta.env.DEV) {
              setRecentBookings([
                {
                  id: '1',
                  clientName: 'Mario Rossi',
                  clientEmail: 'mario.rossi@test.com',
                  service: 'Fisioterapia',
                  date: '2025-08-07',
                  time: '10:00',
                  status: 'CONFIRMED',
                  therapist: 'Dr. Laura Bianchi',
                  staffId: 'mock-staff-1',
                  staffEmail: 'laura.bianchi@kinetica.it',
                  price: 80,
                  createdAt: new Date().toISOString()
                },
                {
                  id: '2',
                  clientName: 'Anna Verdi',
                  clientEmail: 'anna.verdi@test.com',
                  service: 'Osteopatia',
                  date: '2025-08-07',
                  time: '14:30',
                  status: 'PENDING',
                  therapist: 'Dr. Marco Neri',
                  staffId: 'mock-staff-2',
                  staffEmail: 'osteopata@kinetica.it',
                  price: 85,
                  createdAt: new Date().toISOString()
                }
              ]);
            }
          }

          // Fetch recent users for modal functionality - solo per admin
          if (isAdmin(user)) {
            try {
              const usersResponse = await apiService.getAdminUsers({ limit: 50 });
              if (usersResponse.success) {
                setUsers(usersResponse.data.users);
              }
            } catch (userError) {
              console.warn('Could not load users (admin only):', userError);
              // Non mostrare errore per questo - è normale per staff
            }
          }

          // Fetch services data - sempre per admin e staff
          try {
            const servicesResponse = await apiService.getAdminServices();
            if (servicesResponse.success && servicesResponse.data) {
              setServices(servicesResponse.data);
            }
          } catch (servicesError) {
            console.warn('Could not load services:', servicesError);
            setServices([]);
          }

          // Fetch staff data - sempre per admin e staff
          try {
            const staffResponse = await apiService.getAdminStaff();
            if (staffResponse.success && staffResponse.data) {
              setStaff(staffResponse.data);
            }
          } catch (staffError) {
            console.warn('Could not load staff:', staffError);
            setStaff([]);
          }
        } catch (error) {
          console.error('Error loading admin data:', error);
          showError('Errore nel caricamento dei dati amministrativi');
          // Fallback to mock data in development
          if (import.meta.env.DEV) {
            setStats({
              totalUsers: 156,
              totalBookings: 423,
              todayBookings: 12,
              pendingBookings: 8,
              revenue: 12450,
              completedBookings: 387
            });
            setRecentBookings([
              {
                id: '1',
                clientName: 'Mario Rossi',
                clientEmail: 'mario.rossi@test.com',
                service: 'Fisioterapia',
                date: '2025-08-07',
                time: '10:00',
                status: 'CONFIRMED',
                therapist: 'Dr. Laura Bianchi',
                staffId: 'mock-staff-1',
                staffEmail: 'laura.bianchi@kinetica.it',
                price: 80,
                createdAt: new Date().toISOString()
              }
            ]);
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadAdminData();
    }
  }, [user, navigate, showError, authLoading]);

  // Modal handler functions
  const handleBookingStatusUpdate = async (
    bookingId: string, 
    status: string, 
    updates: {
      notes?: string;
      amount?: number;
      isPaid?: boolean;
      paymentMethod?: string;
    }
  ) => {
    try {
      const { notes, ...paymentInfo } = updates;
      const response = await apiService.updateBookingStatus(bookingId, status, notes, paymentInfo);
      if (response.success) {
        showSuccess('Stato aggiornato', 'Lo stato della prenotazione è stato aggiornato con successo');
        // Refresh bookings
        const bookingsResponse = await apiService.getRecentBookings(10);
        if (bookingsResponse.success) {
          let recentBookingsData = bookingsResponse.data;
          
          // Filtro client-side aggiuntivo per staff (sicurezza extra)
          if (user && user.role?.toLowerCase() === 'staff') {
            recentBookingsData = recentBookingsData.filter((booking: RecentBooking) => 
              booking.staffEmail === user.email
            );
          }
          
          setRecentBookings(recentBookingsData);
        }
      } else {
        showError('Errore', 'Impossibile aggiornare lo stato della prenotazione');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      showError('Errore', 'Si è verificato un errore durante l\'aggiornamento');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        showSuccess('Utente eliminato', 'L\'utente è stato eliminato con successo');
        // Refresh users - solo per admin
        if (isAdmin(user)) {
          const usersResponse = await apiService.getAdminUsers({ limit: 50 });
          if (usersResponse.success) {
            setUsers(usersResponse.data.users);
          }
        }
      } else {
        showError('Errore', 'Impossibile eliminare l\'utente');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Errore', 'Si è verificato un errore durante l\'eliminazione');
    }
  };

  // Filtra le prenotazioni in base al filtro di pagamento
  const filteredBookings = recentBookings.filter(booking => {
    if (paymentFilter === 'paid') return booking.isPaid;
    if (paymentFilter === 'unpaid') return !booking.isPaid;
    return true; // 'all'
  });

  const handleLogout = async () => {
    try {
      await logout(() => navigate('/'));
      showSuccess('Logout effettuato', 'A presto!');
    } catch (error) {
      showError('Errore logout', 'Si è verificato un errore');
    }
  };

  // Don't render anything if user doesn't have permissions
  if (!user || !isAdminOrStaff(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
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
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const adminStats = [
    { 
      label: 'Utenti Totali', 
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Prenotazioni Totali', 
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'Appuntamenti Oggi', 
      value: stats.todayBookings,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      label: 'In Attesa Conferma', 
      value: stats.pendingBookings,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    { 
      label: 'Fatturato Mensile', 
      value: stats.revenue,
      prefix: '€',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      label: 'Sessioni Completate', 
      value: stats.completedBookings,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  // Return loading state if data is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Dashboard Admin */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
          <div className="container-max px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Dashboard {getRoleDisplayName(user?.role || '')}
                  </h1>
                  <p className="text-primary-100">
                    Caricamento dati...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container-max px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Caricamento dati amministrativi...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Dashboard Admin */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
        <div className="container-max px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Dashboard {getRoleDisplayName(user?.role || '')}
                </h1>
                <p className="text-primary-100">
                  Benvenuto, {user?.firstName}! Gestisci il centro da qui.
                </p>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-3">
              {isAdmin(user) && (
                <Link
                  to="/admin/users"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center backdrop-blur-sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Gestisci Utenti
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-max px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {adminStats.map((stat, index) => (
            <AnimatedCard key={stat.label} delay={index * 100}>
              <div className="flex items-center">
                <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="flex items-baseline mt-1">
                    {stat.prefix && (
                      <span className="text-lg font-bold text-gray-900 mr-1">{stat.prefix}</span>
                    )}
                    <SimpleCounter 
                      end={stat.value} 
                      className="text-2xl font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        {/* Pulsante Statistiche Dettagliate */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setShowStatsModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Visualizza Statistiche Dettagliate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prenotazioni Recenti */}
          <div className="lg:col-span-2">
            <AnimatedCard delay={400}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                    Prenotazioni Recenti
                  </h2>
                  
                  {/* Filtri Pagamento migliorati */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                      >
                        <option value="all">Tutti i pagamenti</option>
                        <option value="paid">Solo pagati</option>
                        <option value="unpaid">Non pagati</option>
                      </select>
                      <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                    
                    {paymentFilter !== 'all' && (
                      <button
                        onClick={() => setPaymentFilter('all')}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md flex items-center space-x-1 transition-colors"
                        title="Rimuovi filtro"
                      >
                        <X className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {filteredBookings.length} di {recentBookings.length}
                  </span>
                  <Link 
                    to="/admin/bookings" 
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1 hover:underline"
                  >
                    <span>Visualizza tutte</span>
                    <Activity className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">
                        {paymentFilter === 'paid' ? 'Nessuna prenotazione pagata trovata' :
                         paymentFilter === 'unpaid' ? 'Nessuna prenotazione non pagata trovata' :
                         'Nessuna prenotazione trovata'}
                      </p>
                    </div>
                  ) : (
                    filteredBookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        {/* Layout Mobile-First */}
                        <div className="p-4">
                          {/* Header: Nome cliente e stato */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              {getStatusIcon(booking.status)}
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 truncate">{booking.clientName}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                    {booking.status === 'CONFIRMED' ? 'Confermato' :
                                     booking.status === 'PENDING' ? 'In attesa' :
                                     booking.status === 'COMPLETED' ? 'Completato' : 'Annullato'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Azioni - sempre visibili */}
                            <div className="flex items-center space-x-1 ml-2">
                              <button 
                                onClick={() => setSelectedBooking(booking)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-lg"
                                title="Visualizza dettagli"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setSelectedBooking(booking)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors hover:bg-green-50 rounded-lg"
                                title="Modifica prenotazione"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Dettagli prenotazione */}
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="text-sm font-medium text-gray-900">{booking.service}</span>
                              <span className="hidden sm:inline text-gray-400">•</span>
                              <span className="text-sm text-gray-600">
                                {new Date(booking.date).toLocaleDateString('it-IT')} alle {booking.time}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500">con {booking.therapist}</p>
                            
                            {/* Informazioni Pagamento - Mobile Optimized */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs font-medium text-gray-700">
                                  €{booking.amount || booking.price || 0}
                                </span>
                                {booking.isPaid ? (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    <span className="text-xs text-green-600 font-medium">Pagato</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <CreditCard className="w-3 h-3 text-orange-600" />
                                    <span className="text-xs text-orange-600 font-medium">Non pagato</span>
                                  </div>
                                )}
                              </div>
                              
                              {booking.paymentDate && booking.isPaid && (
                                <span className="text-xs text-gray-500">
                                  ({new Date(booking.paymentDate).toLocaleDateString('it-IT')})
                                </span>
                              )}
                              
                              {booking.paymentMethod && booking.isPaid && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {booking.paymentMethod === 'CASH' ? 'Contanti' :
                                   booking.paymentMethod === 'CARD' ? 'Carta' :
                                   booking.paymentMethod === 'TRANSFER' ? 'Bonifico' :
                                   booking.paymentMethod}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </AnimatedCard>
          </div>

          {/* Sidebar Admin - Più organizzata e compatta */}
          <div className="xl:col-span-1 space-y-6">
            {/* Azioni Rapide - Design migliorato */}
            <AnimatedCard delay={500}>
              <div className="flex items-center mb-4">
                <Activity className="w-5 h-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Azioni Rapide</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {isAdmin(user) && (
                  <Link 
                    to="/admin/users" 
                    className="flex items-center space-x-3 w-full text-left p-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all duration-200 group border border-gray-100 hover:border-primary-200"
                  >
                    <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Gestisci Utenti</span>
                  </Link>
                )}
                
                <Link 
                  to="/admin/bookings" 
                  className="flex items-center space-x-3 w-full text-left p-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all duration-200 group border border-gray-100 hover:border-primary-200"
                >
                  <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Gestisci Prenotazioni</span>
                </Link>
                
                {isAdmin(user) && (
                  <Link 
                    to="/admin/services" 
                    className="flex items-center space-x-3 w-full text-left p-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all duration-200 group border border-gray-100 hover:border-primary-200"
                  >
                    <Settings className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Gestisci Servizi</span>
                  </Link>
                )}
                
                {isAdmin(user) && (
                  <Link 
                    to="/admin/staff" 
                    className="flex items-center space-x-3 w-full text-left p-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all duration-200 group border border-gray-100 hover:border-primary-200"
                  >
                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Gestisci Staff</span>
                  </Link>
                )}
                
                <Link 
                  to="/admin/reports" 
                  className="flex items-center space-x-3 w-full text-left p-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all duration-200 group border border-gray-100 hover:border-primary-200"
                >
                  <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Report e Analytics</span>
                </Link>
                
                {isAdmin(user) && (
                  <Link 
                    to="/admin/settings" 
                    className="flex items-center space-x-3 w-full text-left p-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-all duration-200 group border border-gray-100 hover:border-primary-200"
                  >
                    <Settings className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Impostazioni</span>
                  </Link>
                )}
              </div>
            </AnimatedCard>

            {/* Gestione Utenti - solo per admin - Design compatto */}
            {isAdmin(user) && (
              <AnimatedCard delay={600}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-blue-600 mr-2" />
                    <h3 className="text-base font-semibold text-gray-900">Utenti</h3>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {users.length} registrati
                  </span>
                </div>
                
                <div className="space-y-2">
                  {users.slice(0, 2).map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-2 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {users.length > 2 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-500">
                        +{users.length - 2} altri utenti
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <Link 
                    to="/admin/users" 
                    className="flex items-center justify-center space-x-2 w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>Gestisci Tutti</span>
                  </Link>
                </div>
              </AnimatedCard>
            )}

            {/* Gestione Servizi - Design compatto */}
            <AnimatedCard delay={700}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-green-600 mr-2" />
                  <h3 className="text-base font-semibold text-gray-900">Servizi</h3>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {services.filter(s => s.isActive).length} attivi
                </span>
              </div>
              
              <div className="space-y-2">
                {services.filter(s => s.isActive).slice(0, 2).map((service) => (
                  <div 
                    key={service.id}
                    className="flex items-center justify-between p-2 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center" 
                        style={{ backgroundColor: service.color + '20' }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: service.color }}
                        ></div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-green-600 font-medium">€{service.price} • {service.duration}min</p>
                      </div>
                    </div>

                  </div>
                ))}
                
                {services.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nessun servizio configurato</p>
                  </div>
                )}
                
                {services.filter(s => s.isActive).length > 2 && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-gray-500">
                      +{services.filter(s => s.isActive).length - 2} altri servizi
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Link 
                  to="/admin/services" 
                  className="flex items-center justify-center space-x-2 w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Activity className="w-4 h-4" />
                  <span>Gestisci Tutti</span>
                </Link>
              </div>
            </AnimatedCard>

            {/* Gestione Staff - Design compatto */}
            <AnimatedCard delay={750}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <UserPlus className="w-4 h-4 text-purple-600 mr-2" />
                  <h3 className="text-base font-semibold text-gray-900">Staff</h3>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {staff.filter(s => s.isActive).length} membri
                </span>
              </div>
              
              <div className="space-y-2">
                {staff.filter(s => s.isActive).slice(0, 2).map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-2 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 text-xs font-medium">
                          {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{member.specialization || member.role}</p>
                      </div>
                    </div>
                  
                  </div>
                ))}
                
                {staff.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nessun membro dello staff</p>
                  </div>
                )}
                
                {staff.filter(s => s.isActive).length > 2 && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-gray-500">
                      +{staff.filter(s => s.isActive).length - 2} altri membri
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Link 
                  to="/admin/staff" 
                  className="flex items-center justify-center space-x-2 w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Gestisci Tutti</span>
                </Link>
              </div>
            </AnimatedCard>
          </div>
        </div>

        {/* Modals */}
        {selectedBooking && (
          <BookingDetailsModal
            booking={selectedBooking}
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onStatusUpdate={handleBookingStatusUpdate}
          />
        )}

        {selectedUser && isAdmin(user) && (
          <UserDetailsModal
            user={selectedUser}
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            onDeleteUser={handleDeleteUser}
            currentUserRole={user?.role || 'USER'}
          />
        )}

        {showStatsModal && (
          <StatsModal
            isOpen={showStatsModal}
            onClose={() => setShowStatsModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
