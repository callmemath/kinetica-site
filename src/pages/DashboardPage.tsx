import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Settings,
  LogOut,
  Activity,
  Phone,
  Mail,
  MapPin,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../contexts/ToastContext';
import AdminRedirect from '../components/AdminRedirect';
import AnimatedCard from '../components/AnimatedCard';
import SimpleCounter from '../components/SimpleCounter';
import { apiService, type Booking as ApiBooking } from '../services/api';
import { STUDIO_INFO, formatters } from '../config/studioInfo';

// Estendi il tipo per aggiungere display properties
interface Booking extends ApiBooking {
  displayDate?: string;
}

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Forza il re-render delle statistiche

  // Forza l'aggiornamento delle statistiche ad ogni refresh della pagina
  useEffect(() => {
    const forceStatsUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    // Aggiorna immediatamente al montaggio del componente
    forceStatsUpdate();

    // Opzionale: aggiorna ogni minuto per mantenere l'orario aggiornato
    const interval = setInterval(forceStatsUpdate, 60000); // 60 secondi

    return () => clearInterval(interval);
  }, []); // Dipendenze vuote = si attiva solo al montaggio del componente

  // Carica le prenotazioni dall'API ad ogni refresh
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        console.log('No user authenticated, skipping booking fetch');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching bookings for user:', user.email);
        setIsLoading(true);
        const response = await apiService.getBookings();
        
        console.log('API Response:', response);
        
        if (response.success && response.data) {
          console.log('API Response successful, bookings count:', response.data.length);
          // Converti le date per il display e aggiungi proprietà mancanti
          const processedBookings: Booking[] = response.data.map(booking => ({
            ...booking,
            displayDate: new Date(booking.date).toLocaleDateString('it-IT')
          }));
          
          setBookings(processedBookings);
        } else {
          throw new Error(response.message || 'Errore nel caricamento delle prenotazioni');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        }
        showError('Errore', 'Impossibile caricare le prenotazioni');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user, showError, refreshKey]); // Aggiungo refreshKey alle dipendenze

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confermato';
      case 'PENDING':
        return 'In attesa';
      case 'CANCELLED':
        return 'Annullato';
      case 'COMPLETED':
        return 'Completato';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    try {
      await logout(() => navigate('/'));
      showSuccess('Logout effettuato', 'A presto!');
    } catch (error) {
      showError('Errore logout', 'Si è verificato un errore');
    }
  };

  // Funzione per calcolare quanto tempo è attivo l'account (si aggiorna ad ogni refresh)
  const accountAge = useMemo(() => {
    if (!user?.createdAt) return { value: 0, suffix: ' giorni' };
    
    const createdDate = new Date(user.createdAt);
    const now = new Date();
    
    // Calcolo preciso di anni e mesi
    let years = now.getFullYear() - createdDate.getFullYear();
    let months = now.getMonth() - createdDate.getMonth();
    let days = now.getDate() - createdDate.getDate();
    
    // Aggiusta il calcolo se il giorno corrente è minore del giorno di creazione
    if (days < 0) {
      months--;
      // Calcola i giorni rimanenti del mese precedente
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    // Aggiusta il calcolo se il mese corrente è minore del mese di creazione
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Determina quale unità di tempo mostrare
    if (years > 0) {
      // Se ha più di un anno, mostra anni e mesi
      if (months > 0) {
        return { 
          value: years, 
          suffix: `${years === 1 ? ' anno' : ' anni'} e ${months} ${months === 1 ? 'mese' : 'mesi'}` 
        };
      } else {
        return { 
          value: years, 
          suffix: years === 1 ? ' anno' : ' anni' 
        };
      }
    } else if (months > 0) {
      // Se ha più di un mese, mostra mesi e settimane/giorni
      if (days >= 7) {
        const weeks = Math.floor(days / 7);
        return { 
          value: months, 
          suffix: `${months === 1 ? ' mese' : ' mesi'} e ${weeks} ${weeks === 1 ? 'settimana' : 'settimane'}` 
        };
      } else if (days > 0) {
        return { 
          value: months, 
          suffix: `${months === 1 ? ' mese' : ' mesi'} e ${days} ${days === 1 ? 'giorno' : 'giorni'}` 
        };
      } else {
        return { 
          value: months, 
          suffix: months === 1 ? ' mese' : ' mesi' 
        };
      }
    } else {
      // Meno di un mese: mostra giorni
      const totalDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        value: totalDays || 1, // Almeno 1 giorno se registrato oggi
        suffix: (totalDays === 1 || totalDays === 0) ? ' giorno' : ' giorni' 
      };
    }
  }, [user?.createdAt, refreshKey]); // Si ricalcola quando cambia refreshKey

  const upcomingBookings = bookings.filter(b => {
    try {
      // Crea una data per l'appuntamento
      const bookingDate = new Date(b.date);
      const [hours, minutes] = b.startTime.split(':').map(Number);
      
      // Imposta l'ora dell'appuntamento
      bookingDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      
      return bookingDate > now && b.status !== 'CANCELLED';
    } catch (error) {
      console.error('Error parsing booking date:', error, b);
      return false;
    }
  });

  const stats = [
    { 
      label: 'Prenotazioni Totali', 
      value: bookings.length,
      icon: Calendar,
      color: 'text-blue-600'
    },
    { 
      label: 'Sessioni Completate', 
      value: bookings.filter(b => b.status === 'COMPLETED').length,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    { 
      label: 'Prossimi Appuntamenti', 
      value: upcomingBookings.length,
      icon: Clock,
      color: 'text-orange-600'
    },
    { 
      label: 'Account Attivo da', 
      value: accountAge.value,
      suffix: accountAge.suffix,
      icon: Activity,
      color: 'text-purple-600'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accesso richiesto</h1>
          <Link to="/login" className="btn-primary">
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminRedirect>
      <div className="min-h-screen bg-gray-50">
        {/* Header Dashboard */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-max px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Benvenuto, {user.firstName}!
                </h1>
                <p className="text-gray-600">
                  {user.email}
                </p>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Link
                to="/prenota"
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuova Prenotazione
              </Link>
              
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-max px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <AnimatedCard key={stat.label} delay={index * 100}>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="flex items-baseline">
                    <SimpleCounter 
                      end={stat.value} 
                      className="text-2xl font-bold text-gray-900"
                    />
                    {stat.suffix && (
                      <span className="text-sm text-gray-600 ml-1">{stat.suffix}</span>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prossimi Appuntamenti */}
          <div className="lg:col-span-2">
            <AnimatedCard delay={400}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Prossimi Appuntamenti</h2>
                <Link 
                  to="/prenota" 
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Prenota nuovo
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(booking.status)}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {booking.service?.name || 'Servizio non specificato'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {booking.displayDate || new Date(booking.date).toLocaleDateString('it-IT')} alle {booking.startTime}
                            </p>
                            {booking.staff && (
                              <p className="text-sm text-gray-500">
                                con {booking.staff.firstName} {booking.staff.lastName}
                              </p>
                            )}
                            
                            {/* Informazioni Pagamento */}
                            <div className="flex items-center space-x-3 mt-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-medium text-gray-700">
                                  €{booking.amount || booking.service?.price || 0}
                                </span>
                                {booking.isPaid ? (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-green-600 font-medium">Pagato</span>
                                    {booking.paymentDate && (
                                      <span className="text-sm text-gray-500">
                                        ({new Date(booking.paymentDate).toLocaleDateString('it-IT')})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <CreditCard className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm text-orange-600 font-medium">Da pagare</span>
                                  </div>
                                )}
                              </div>
                              
                              {booking.paymentMethod && booking.isPaid && (
                                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {booking.paymentMethod === 'CASH' ? 'Contanti' :
                                   booking.paymentMethod === 'CARD' ? 'Carta' :
                                   booking.paymentMethod === 'TRANSFER' ? 'Bonifico' :
                                   booking.paymentMethod}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      
                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nessun appuntamento in programma
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Prenota la tua prossima sessione
                  </p>
                  <Link to="/prenota" className="btn-primary">
                    Prenota ora
                  </Link>
                </div>
              )}
            </AnimatedCard>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Profilo Utente */}
            <AnimatedCard delay={500}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Il Mio Profilo</h3>
                <Settings className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{user.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link 
                  to="/profilo"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Modifica profilo
                </Link>
              </div>
            </AnimatedCard>

            {/* Informazioni Centro */}
            <AnimatedCard delay={600}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contatti Centro</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p>{STUDIO_INFO.address.street}</p>
                    <p>{STUDIO_INFO.address.postalCode} {STUDIO_INFO.address.city} ({STUDIO_INFO.address.province})</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`tel:${formatters.formatPhoneLink(STUDIO_INFO.contact.phone)}`}
                    className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {formatters.formatPhone(STUDIO_INFO.contact.phone)}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a 
                    href={formatters.formatEmailLink(STUDIO_INFO.contact.email)}
                    className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {STUDIO_INFO.contact.email}
                  </a>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Orari:</p>
                  {Object.entries(STUDIO_INFO.workingHours.formatted).map(([period, hours]) => (
                    <p key={period}>{period}: {hours}</p>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
    </AdminRedirect>
  );
};

export default DashboardPage;
