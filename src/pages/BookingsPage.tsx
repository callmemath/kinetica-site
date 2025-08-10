import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  AlertTriangle,
  Plus,
  User,
  Phone,
  Edit3,
  Trash2,
  Eye,
  X,
  Shield,
  Info,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiService, type Booking } from '../services/api';
import { isAdmin, isStaff } from '../utils/roles';
import AnimatedCard from '../components/AnimatedCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAvailableTimeSlotsForService, isServiceAvailable, calculateEndTime } from '../utils/serviceAvailability';

// Status utility functions
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

// Notification/Toast Component
const Notification = ({ notification, onClose }: {
  notification: {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  };
  onClose: (id: string) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animazione di entrata
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    // Auto-dismiss
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 400);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 400);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        );
      case 'error':
        return (
          <div className="p-2 bg-red-100 rounded-full">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-blue-100 rounded-full">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
        );
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800';
      default:
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800';
    }
  };

  const getShadow = () => {
    switch (notification.type) {
      case 'success':
        return 'shadow-green-500/20';
      case 'error':
        return 'shadow-red-500/20';
      default:
        return 'shadow-blue-500/20';
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl border-2 shadow-xl backdrop-blur-sm transition-all duration-400 ease-out transform ${
        isVisible 
          ? 'translate-x-0 opacity-100 scale-100 rotate-0' 
          : 'translate-x-full opacity-0 scale-95 rotate-1'
      } ${getColors()} ${getShadow()}`}
      style={{
        boxShadow: isVisible 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          : 'none'
      }}
    >
      <div className="flex items-start space-x-3">
        <div className={`transition-all duration-500 delay-100 ${
          isVisible ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-45'
        }`}>
          {getIcon()}
        </div>
        <div className={`flex-1 transition-all duration-400 delay-150 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}>
          <h4 className="font-bold tracking-tight">{notification.title}</h4>
          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
        </div>
        <button
          onClick={handleClose}
          className={`text-current opacity-60 hover:opacity-100 hover:text-red-500 rounded-full p-1 transition-all duration-200 hover:scale-110 ${
            isVisible ? 'translate-y-0 opacity-60' : '-translate-y-2 opacity-0'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Conferma', cancelText = 'Annulla', type = 'danger' }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isAnimating && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-400 ease-out ${
        isVisible 
          ? 'backdrop-blur-lg backdrop-brightness-50 backdrop-saturate-150' 
          : 'backdrop-blur-none backdrop-brightness-100'
      }`}
      style={{
        background: isVisible 
          ? type === 'danger' 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(185, 28, 28, 0.1))'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))'
          : 'transparent'
      }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 transition-all duration-400 ease-out transform ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0 rotate-0' 
            : 'scale-75 opacity-0 translate-y-8 -rotate-2'
        }`}
        style={{
          boxShadow: isVisible 
            ? type === 'danger'
              ? '0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(239, 68, 68, 0.1)'
              : '0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)'
            : 'none'
        }}
      >
        <div className={`p-6 transition-all duration-300 delay-100 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className={`flex items-center space-x-3 mb-6 transition-all duration-400 delay-150 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
          }`}>
            {type === 'danger' ? (
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            ) : (
              <div className="p-3 bg-blue-100 rounded-full">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          
          {/* Sezione dettagli prenotazione per cancellazione */}
          {title.includes('Annulla') && message.includes('DETTAGLI_PRENOTAZIONE') ? (
            <div className={`transition-all duration-400 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-5 mb-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-red-100 rounded-full mr-3">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="font-semibold text-red-800 text-lg">Conferma Cancellazione</span>
                </div>
                
                <div className="space-y-3">
                  {message.split('\n').filter(line => line.includes(':') && !line.includes('DETTAGLI') && !line.includes('ATTENZIONE')).map((line, index) => {
                    const [label, value] = line.split(': ');
                    const getIcon = () => {
                      if (label.includes('Servizio')) return <User className="w-5 h-5 text-blue-600" />;
                      if (label.includes('Data')) return <Calendar className="w-5 h-5 text-green-600" />;
                      if (label.includes('Orario')) return <Clock className="w-5 h-5 text-purple-600" />;
                      return <Info className="w-5 h-5 text-gray-600" />;
                    };
                    
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                        <div className="p-1 bg-white rounded-full">
                          {getIcon()}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">{label}</span>
                          <p className="text-gray-900 font-semibold">{value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className={`text-gray-600 mb-4 whitespace-pre-line transition-all duration-400 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}>{message}</p>
          )}
          
          {/* Banner di avviso se il messaggio contiene "ATTENZIONE" */}
          {message.includes('ATTENZIONE') && (
            <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 transition-all duration-400 delay-300 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
            }`}>
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-full mr-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">Operazione Irreversibile</p>
                  <p className="text-amber-700 text-xs mt-1">Questa azione non potrà essere annullata una volta confermata</p>
                </div>
              </div>
            </div>
          )}
          
          <div className={`flex justify-end space-x-4 transition-all duration-400 delay-250 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 hover:scale-105 font-medium flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>{cancelText}</span>
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-6 py-3 text-white rounded-xl transition-all duration-200 hover:scale-105 transform font-medium flex items-center space-x-2 ${
                type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30'
              }`}
            >
              {type === 'danger' ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, children, title }: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isAnimating && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-500 ease-out ${
        isVisible 
          ? 'backdrop-blur-md backdrop-brightness-75 backdrop-saturate-150' 
          : 'backdrop-blur-none backdrop-brightness-100'
      }`}
      style={{
        background: isVisible 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' 
          : 'transparent'
      }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] border border-gray-200 transition-all duration-500 ease-out transform flex flex-col ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0 rotate-0 blur-none' 
            : 'scale-90 opacity-0 translate-y-12 rotate-1 blur-sm'
        }`}
        style={{
          boxShadow: isVisible 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
            : 'none'
        }}
      >
        <div className={`flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 transition-all duration-300 flex-shrink-0 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 rounded-full p-2 transition-all duration-300 hover:scale-110"
          >
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className={`flex-1 p-4 sm:p-6 overflow-y-auto transition-all duration-400 delay-100 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Componente per visualizzare i dettagli della prenotazione
// BookingModifyModal Component
const BookingModifyModal: React.FC<{
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: any) => Promise<void>;
}> = ({ booking, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Stati per gestire la disponibilità degli slot
  const [slotsAvailability, setSlotsAvailability] = useState<Record<string, boolean>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    if (booking && isOpen) {
      setFormData({
        date: booking.date,
        time: booking.startTime,
        notes: booking.notes || ''
      });
    }
  }, [booking, isOpen]);

  // Helper function to check if a time slot is available
  const isSlotAvailable = (time: string): boolean => {
    // Se non abbiamo ancora caricato la disponibilità, permetti tutto temporaneamente
    if (Object.keys(slotsAvailability).length === 0) return true;
    
    // Controlla se l'orario è nella lista degli slot disponibili per il servizio
    if (!availableTimeSlots.includes(time)) return false;
    
    // Controlla la disponibilità specifica per questo slot
    return slotsAvailability[time] === true;
  };

  // Carica la disponibilità quando cambia la data
  useEffect(() => {
    const loadAvailability = async () => {
      if (!booking?.service || !booking?.staff || !formData.date) {
        setSlotsAvailability({});
        setAvailableTimeSlots([]);
        return;
      }

      try {
        setLoadingAvailability(true);
        
        // Ensure date is properly formatted as YYYY-MM-DD
        const formattedDate = formData.date.includes('-') ? formData.date : 
          new Date(formData.date).toISOString().split('T')[0];
        
        console.log('BookingModifyModal - Loading availability for:', {
          date: formattedDate,
          serviceId: booking.service.id,
          staffId: booking.staff.id,
          serviceAvailability: booking.service.availability
        });
        
        // 1. Prima ottieni gli orari disponibili per il servizio basati sulla sua configurazione
        const serviceTimeSlots = getAvailableTimeSlotsForService(
          booking.service.availability,
          formattedDate,
          booking.service.duration
        );
        
        setAvailableTimeSlots(serviceTimeSlots);
        
        // Se il servizio non ha orari disponibili per questo giorno, ferma qui
        if (serviceTimeSlots.length === 0) {
          setSlotsAvailability({});
          return;
        }
        
        // 2. Poi verifica la disponibilità dello staff per questi orari
        const response = await apiService.getAvailabilityWithBlocks(formattedDate, booking.service.id, booking.staff.id);
        
        if (response.success && response.data && response.data.slots) {
          // Combina disponibilità del servizio con quella dello staff
          const availability: Record<string, boolean> = {};
          
          serviceTimeSlots.forEach(slot => {
            // Verifica se l'orario è disponibile secondo il servizio
            const endTime = calculateEndTime(slot, booking.service.duration);
            const serviceAvailable = isServiceAvailable(
              booking.service.availability,
              formattedDate,
              slot,
              endTime
            );
            
            // Verifica se lo staff è disponibile (dall'API)
            const staffSlot = response.data!.slots.find(s => s.time === slot);
            const staffAvailable = staffSlot ? staffSlot.available : false;
            
            // L'orario è disponibile se:
            // 1. Il servizio è disponibile E lo staff è disponibile
            // 2. OPPURE se è l'orario attualmente prenotato E siamo nella stessa data originale
            const isCurrentSlot = slot === booking.startTime && formattedDate === booking.date;
            availability[slot] = (serviceAvailable && staffAvailable) || isCurrentSlot;
          });
          
          setSlotsAvailability(availability);
          console.log('BookingModifyModal - Final availability object:', availability);
        } else {
          // Fallback: solo controllo disponibilità servizio
          const availability: Record<string, boolean> = {};
          serviceTimeSlots.forEach(slot => {
            const endTime = calculateEndTime(slot, booking.service.duration);
            const serviceAvailable = isServiceAvailable(
              booking.service.availability,
              formattedDate,
              slot,
              endTime
            );
            // Solo l'orario corrente è protetto se siamo nella data originale
            const isCurrentSlot = slot === booking.startTime && formattedDate === booking.date;
            availability[slot] = serviceAvailable || isCurrentSlot;
          });
          setSlotsAvailability(availability);
        }
      } catch (error) {
        console.error('Error loading availability in modify modal:', error);
        // In caso di errore, mostra solo gli orari del servizio (se cambiamo data non proteggiamo l'orario originale)
        const serviceTimeSlots = getAvailableTimeSlotsForService(
          booking.service.availability,
          formData.date,
          booking.service.duration
        );
        setAvailableTimeSlots(serviceTimeSlots);
        
        const availability: Record<string, boolean> = {};
        serviceTimeSlots.forEach(slot => {
          // In caso di errore, permetti tutti gli orari del servizio
          availability[slot] = true;
        });
        setSlotsAvailability(availability);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, [formData.date, booking]);

  // Reset dell'orario quando cambia la data
  useEffect(() => {
    if (formData.date !== booking?.date) {
      // Se la data è cambiata, resetta sempre l'orario
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [formData.date, booking?.date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione di base
    if (!formData.time) {
      console.error('Nessun orario selezionato');
      return;
    }
    
    // Validazione disponibilità solo se abbiamo caricato i dati
    if (Object.keys(slotsAvailability).length > 0 && !isSlotAvailable(formData.time)) {
      console.error('Orario selezionato non disponibile:', formData.time);
      return;
    }
    
    setIsLoading(true);
    try {
      // Converti il campo time in startTime per l'API
      const bookingData = {
        date: formData.date,
        startTime: formData.time,
        notes: formData.notes
      };
      
      await onSave(bookingData);
      onClose();
    } catch (error) {
      console.error('Errore nel salvare la prenotazione:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifica Prenotazione">
      <div className="flex flex-col h-full space-y-4">
        {/* Header informativo */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <Edit3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium text-blue-800 text-sm sm:text-base">Modifica Dettagli</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-white/50 rounded-lg">
              <div className="p-1 bg-white rounded-full">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">Servizio</span>
                <p className="text-gray-900 font-semibold text-sm">{booking.service.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-white/50 rounded-lg">
              <div className="p-1 bg-white rounded-full">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">Professionista</span>
                <p className="text-gray-900 font-semibold text-sm">
                  {booking.staff?.firstName} {booking.staff?.lastName}
                </p>
                {booking.staff?.specialization && (
                  <p className="text-xs text-gray-600">{booking.staff.specialization}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form scrollabile */}
        <div className="flex-1 min-h-0">
          <form id="modify-booking-form" onSubmit={handleSubmit} className="space-y-4 h-full overflow-y-auto">
          {/* Data */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 mr-2 text-green-600" />
              Nuova Data
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base"
              required
            />
          </div>

          {/* Orario */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Clock className="w-4 h-4 mr-2 text-purple-600" />
              Nuovo Orario
              {loadingAvailability && (
                <span className="ml-2 text-xs text-gray-500">(Caricamento disponibilità...)</span>
              )}
            </label>
            
            {/* Griglia di orari disponibili */}
            <div className="grid grid-cols-3 gap-2">
              {availableTimeSlots.length === 0 && booking?.service && formData.date ? (
                <div className="col-span-3 text-center py-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-yellow-800 font-medium text-sm">Nessun orario disponibile</p>
                  <p className="text-yellow-600 text-xs mt-1">
                    Il servizio non è disponibile per questa data.
                  </p>
                </div>
              ) : (
                availableTimeSlots.map((slot) => {
                  const isAvailable = isSlotAvailable(slot);
                  const isSelected = formData.time === slot;
                  const isCurrentBookingSlot = slot === booking?.startTime;
                  const isSameDate = formData.date === booking?.date;
                  
                  return (
                    <label key={slot} className={`${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                      <input
                        type="radio"
                        name="time"
                        value={slot}
                        checked={isSelected}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                        disabled={!isAvailable}
                        className="sr-only"
                      />
                      <div className={`px-2 py-1.5 text-center text-xs sm:text-sm rounded-lg border transition-all duration-200 ${
                        !isAvailable
                          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          : isSelected
                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-600 shadow-lg transform scale-105'
                            : isCurrentBookingSlot && isSameDate
                              ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 text-blue-800 hover:border-primary-300 hover:shadow-md transform hover:scale-102'
                              : 'bg-gradient-to-r from-white to-gray-50 border-gray-300 hover:border-primary-300 hover:shadow-md hover:from-primary-50 hover:to-blue-50 transform hover:scale-102'
                      }`}>
                        {slot}
                        {isCurrentBookingSlot && isSameDate && !isSelected && (
                          <div className="text-xs text-blue-600 mt-0.5">Attuale</div>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            
            {formData.time && !isSlotAvailable(formData.time) && (
              <p className="text-red-500 text-xs mt-1">
                L'orario selezionato non è più disponibile. Scegli un altro orario.
              </p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Edit3 className="w-4 h-4 mr-2 text-amber-600" />
              Note Aggiuntive
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base resize-none"
              placeholder="Aggiungi note o richieste speciali (opzionale)"
            />
          </div>
          </form>
        </div>

        {/* Actions - Fissi in basso */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 hover:scale-105 font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <X className="w-4 h-4" />
            <span>Annulla</span>
          </button>
          <button
            type="submit"
            form="modify-booking-form"
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Salva Modifiche</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// BookingDetailsModal Component
const BookingDetailsModal: React.FC<{
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ booking, isOpen, onClose }) => {
  if (!booking) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dettagli Prenotazione">
      <div className="space-y-5">
        {/* Header informativo */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-indigo-100 rounded-full mr-2">
              <Eye className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="font-semibold text-indigo-800 text-base">Riepilogo Prenotazione</span>
          </div>
          
          <div className="bg-white/50 rounded-lg p-3">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {booking.service?.name || 'Servizio non specificato'}
            </h3>
            <p className="text-sm text-gray-600">
              {booking.service?.description || 'Nessuna descrizione disponibile'}
            </p>
          </div>
        </div>

        {/* Informazioni principali - Layout organizzato */}
        <div className="space-y-4">
          {/* Prima riga: Data e Orario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="p-2 bg-green-100 rounded-full">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs font-medium text-green-600">Data Appuntamento</div>
                <div className="font-medium text-gray-900 text-sm">
                  {new Date(booking.date).toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="p-2 bg-purple-100 rounded-full">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-xs font-medium text-purple-600">Orario</div>
                <div className="font-medium text-gray-900 text-sm">{booking.startTime} - {booking.endTime}</div>
              </div>
            </div>
          </div>

          {/* Seconda riga: Durata e Stato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {booking.service?.duration && (
              <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-amber-600">Durata</div>
                  <div className="font-medium text-gray-900 text-sm">{booking.service.duration} minuti</div>
                </div>
              </div>
            )}

            <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
              booking.status === 'CONFIRMED' 
                ? 'bg-emerald-50 border-emerald-200' 
                : booking.status === 'PENDING'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`p-2 rounded-full ${
                booking.status === 'CONFIRMED' 
                  ? 'bg-emerald-100' 
                  : booking.status === 'PENDING'
                  ? 'bg-yellow-100'
                  : 'bg-gray-100'
              }`}>
                <CheckCircle className={`w-4 h-4 ${
                  booking.status === 'CONFIRMED' 
                    ? 'text-emerald-600' 
                    : booking.status === 'PENDING'
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }`} />
              </div>
              <div>
                <div className={`text-xs font-medium ${
                  booking.status === 'CONFIRMED' 
                    ? 'text-emerald-600' 
                    : booking.status === 'PENDING'
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }`}>Stato</div>
                <div className="font-medium text-gray-900 text-sm">{getStatusText(booking.status)}</div>
              </div>
            </div>
          </div>

          {/* Terza riga: Staff e Prezzo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {booking.staff && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-blue-600">Professionista</div>
                  <div className="font-medium text-gray-900 text-sm">
                    {booking.staff.firstName} {booking.staff.lastName}
                  </div>
                  {booking.staff.specialization && (
                    <div className="text-xs text-gray-600 mt-1">{booking.staff.specialization}</div>
                  )}
                </div>
              </div>
            )}

            {/* Informazioni Pagamento */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              booking.isPaid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  booking.isPaid ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {booking.isPaid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-medium ${
                    booking.isPaid ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {booking.isPaid ? 'Pagamento completato' : 'In attesa di pagamento'}
                  </div>
                  <div className="font-medium text-gray-900 text-base">
                    €{booking.amount || booking.service?.price || 0}
                  </div>
                  {booking.isPaid && booking.paymentDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Pagato il {new Date(booking.paymentDate).toLocaleDateString('it-IT')}
                      {booking.paymentMethod && (
                        <span className="ml-2 bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
                          {booking.paymentMethod === 'CASH' ? 'Contanti' :
                           booking.paymentMethod === 'CARD' ? 'Carta' :
                           booking.paymentMethod === 'TRANSFER' ? 'Bonifico' :
                           booking.paymentMethod}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stato di pagamento */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                booking.isPaid 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {booking.isPaid ? 'Pagato' : 'Da pagare'}
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <div className="p-1.5 bg-blue-100 rounded-full mr-2">
              <Edit3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium text-blue-700 text-sm">Note Aggiuntive</span>
          </div>
          
          {booking.notes ? (
            <div className="bg-white border border-blue-100 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">{booking.notes}</p>
            </div>
          ) : (
            <div className="bg-white/50 border border-blue-100 rounded-lg p-4">
              <p className="text-gray-500 italic text-center">Nessuna nota aggiuntiva per questa prenotazione</p>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 hover:scale-105 font-medium text-sm"
          >
            Chiudi
          </button>
        </div>
      </div>
    </Modal>
  );
};

const BookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  
  // Stati per i modali
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Stati per notifiche e dialog
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Funzioni helper per notifiche
  const addNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, type, title, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, options?: { confirmText?: string; type?: 'danger' | 'info' }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: options?.confirmText,
      type: options?.type || 'danger'
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Carica le prenotazioni dal database
  const loadBookings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getBookings();
      
      if (response.success && response.data) {
        setBookings(response.data);
      } else {
        setError(response.message || 'Errore nel caricamento delle prenotazioni');
      }
    } catch (error: any) {
      console.error('Errore nel caricamento delle prenotazioni:', error);
      setError(error.message || 'Errore nel caricamento delle prenotazioni');
    } finally {
      setIsLoading(false);
    }
  };

  // Modal handlers
  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setViewModalOpen(true);
  };

  const handleModifyBooking = (booking: any) => {
    setSelectedBooking(booking);
    setModifyModalOpen(true);
  };

  const handleSaveBooking = async (formData: any) => {
    if (!selectedBooking) return;
    
    try {
      const response = await apiService.updateBooking(selectedBooking.id, formData);

      if (response.success) {
        await loadBookings(); // Ricarica le prenotazioni
        setModifyModalOpen(false);
        setSelectedBooking(null);
      } else {
        throw new Error(response.message || 'Errore nel salvare la prenotazione');
      }
    } catch (error: any) {
      console.error('Errore nel salvare la prenotazione:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  // Booking management functions

  const canCancelBooking = (booking: Booking) => {
    try {
      const bookingDate = new Date(booking.date);
      const [hours, minutes] = booking.startTime.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      const millisecondsInHour = 1000 * 60 * 60;
      const hoursDiff = (bookingDate.getTime() - now.getTime()) / millisecondsInHour;
      
      console.log('🔍 Booking cancel check:', {
        bookingId: booking.id,
        date: booking.date,
        startTime: booking.startTime,
        status: booking.status,
        bookingDateTime: bookingDate.toISOString(),
        now: now.toISOString(),
        hoursDiff: hoursDiff.toFixed(2),
        moreThan48Hours: hoursDiff > 48,
        statusOk: booking.status === 'CONFIRMED' || booking.status === 'PENDING',
        canCancel: (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && hoursDiff > 48
      });
      
      return (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && hoursDiff > 48;
    } catch (error) {
      console.error('❌ Error in canCancelBooking:', error);
      return false;
    }
  };

  const canModifyBooking = (booking: Booking) => {
    try {
      // Admin e staff possono sempre modificare le prenotazioni (anche completate)
      if (user && (isAdmin(user) || isStaff(user))) {
        return true;
      }
      
      // Per gli utenti normali, controllo il timing e lo status
      const bookingDate = new Date(booking.date);
      const [hours, minutes] = booking.startTime.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      const millisecondsInHour = 1000 * 60 * 60;
      const hoursDiff = (bookingDate.getTime() - now.getTime()) / millisecondsInHour;
      
      return (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && hoursDiff > 48;
    } catch (error) {
      console.error('❌ Error in canModifyBooking:', error);
      return false;
    }
  };

  const handleContactSupport = (booking: Booking) => {
    const message = `Salve, ho una prenotazione per ${booking.service?.name} il ${new Date(booking.date).toLocaleDateString('it-IT')} alle ${booking.startTime}. Avrei bisogno di assistenza.`;
    const phoneNumber = '+390108176855'; // Numero dello studio
    const encodedMessage = encodeURIComponent(message);
    
    // Prova prima WhatsApp, poi fallback a chiamata normale
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
    
    showConfirmDialog(
      'Contatta lo Studio',
      'Come preferisci contattare lo studio per questa prenotazione?',
      () => window.open(whatsappUrl, '_blank'),
      { 
        confirmText: 'WhatsApp',
        type: 'info'
      }
    );
  };

  const handleCancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const confirmMessage = `Confermi la cancellazione di questa prenotazione?

DETTAGLI_PRENOTAZIONE
Servizio: ${booking.service?.name}
Data: ${new Date(booking.date).toLocaleDateString('it-IT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}
Orario: ${booking.startTime}

ATTENZIONE: Questa operazione non può essere annullata.`;

    showConfirmDialog(
      'Annulla Prenotazione',
      confirmMessage,
      async () => {
        try {
          // Mostra loading
          setBookings(prev => 
            prev.map(b => 
              b.id === bookingId 
                ? { ...b, status: 'CANCELLING' as any }
                : b
            )
          );

          // Chiama l'API per annullare la prenotazione
          const response = await apiService.cancelBooking(bookingId);
          
          if (response.success) {
            // Aggiorna lo stato locale
            setBookings(prev => 
              prev.map(b => 
                b.id === bookingId 
                  ? { ...b, status: 'CANCELLED' }
                  : b
              )
            );
            
            // Mostra notifica di successo
            addNotification('success', 'Prenotazione Annullata', 'La prenotazione è stata annullata con successo. Riceverai una conferma via email.');
          } else {
            // Ripristina lo stato originale in caso di errore
            setBookings(prev => 
              prev.map(b => 
                b.id === bookingId 
                  ? { ...booking, status: booking.status }
                  : b
              )
            );
            addNotification('error', 'Errore', response.message || 'Errore nell\'annullamento della prenotazione');
          }
        } catch (error: any) {
          console.error('Error cancelling booking:', error);
          
          // Ripristina lo stato originale
          setBookings(prev => 
            prev.map(b => 
              b.id === bookingId 
                ? { ...booking, status: booking.status }
                : b
            )
          );
          
          addNotification('error', 'Errore di Connessione', 'Riprova più tardi o contatta lo studio direttamente.');
        }
      },
      { confirmText: 'Annulla Prenotazione', type: 'danger' }
    );
  };

  const filteredBookings = bookings.filter(booking => {
    // Filtro per status
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false;
    }
    
    // Filtro per pagamento
    if (filterPayment === 'paid' && !booking.isPaid) {
      return false;
    }
    if (filterPayment === 'unpaid' && booking.isPaid) {
      return false;
    }
    
    return true;
  });

  const statusCounts = {
    all: bookings.length,
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    PENDING: bookings.filter(b => b.status === 'PENDING').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
  };

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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container-max px-4 sm:px-6 py-6 sm:py-8">
        {/* Header - Ottimizzato per mobile */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Le Mie Prenotazioni
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                Gestisci i tuoi appuntamenti presso Kinetica Fisioterapia
              </p>
            </div>
            
            <Link
              to="/prenota"
              className="btn-primary flex items-center justify-center w-full sm:w-auto py-3 sm:py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuova Prenotazione
            </Link>
          </div>
          
          {/* Nota importante - Compatta su mobile */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-blue-800">
                <strong>Nota:</strong> Modifiche possibili fino a 48 ore prima.
                <span className="hidden sm:inline">
                  <br />Per urgenze contatta direttamente lo studio.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <AnimatedCard delay={0} className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Filter Tabs - Ottimizzati per mobile */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
            {[
              { key: 'all', label: 'Tutte', count: statusCounts.all },
              { key: 'CONFIRMED', label: 'Confermate', count: statusCounts.CONFIRMED },
              { key: 'PENDING', label: 'In attesa', count: statusCounts.PENDING },
              { key: 'COMPLETED', label: 'Completate', count: statusCounts.COMPLETED },
              { key: 'CANCELLED', label: 'Annullate', count: statusCounts.CANCELLED },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key)}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                  filterStatus === filter.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    filterStatus === filter.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Filtri Pagamento */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Filtro per Pagamento</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                { key: 'all', label: 'Tutti', icon: null },
                { key: 'paid', label: 'Pagati', icon: CheckCircle },
                { key: 'unpaid', label: 'Da pagare', icon: CreditCard },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterPayment(filter.key)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    filterPayment === filter.key
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {filter.icon && (
                    <filter.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      filter.key === 'paid' ? 'text-green-600' : 
                      filter.key === 'unpaid' ? 'text-orange-600' : 'text-gray-400'
                    } ${filterPayment === filter.key ? 'text-white' : ''}`} />
                  )}
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings List - Ottimizzato per mobile */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <AnimatedCard key={booking.id} delay={index * 100}>
                <div className="space-y-4">
                  {/* Header della card - Mobile friendly */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(booking.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                          {booking.service?.name || 'Servizio non specificato'}
                        </h3>
                        <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-4 space-y-1 xs:space-y-0 text-sm text-gray-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{new Date(booking.date).toLocaleDateString('it-IT')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{booking.startTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status e badge - Responsive layout */}
                    <div className="flex flex-row sm:flex-col items-start sm:items-end space-x-2 sm:space-x-0 sm:space-y-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)} whitespace-nowrap`}>
                        {getStatusText(booking.status)}
                      </span>
                      
                      {/* Indicatore pagamento compatto */}
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        booking.isPaid 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}>
                        {booking.isPaid ? (
                          <>
                            <CheckCircle className="w-3 h-3 flex-shrink-0" />
                            <span className="hidden xs:inline">Pagato</span>
                            <span className="xs:hidden">✓</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 flex-shrink-0" />
                            <span>€{booking.amount || booking.service?.price || 0}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Staff info - Mobile friendly */}
                  {booking.staff && (
                    <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 sm:p-4">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm sm:text-base">
                          {booking.staff.firstName} {booking.staff.lastName}
                        </span>
                        {booking.staff.specialization && (
                          <span className="block sm:inline sm:ml-2 text-gray-500 text-xs sm:text-sm mt-1 sm:mt-0">
                            {booking.staff.specialization}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes - Mobile friendly */}
                  {booking.notes && (
                    <div className="text-sm text-gray-600 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <strong className="text-blue-900 text-sm sm:text-base">Note:</strong>
                          <span className="block mt-1 text-xs sm:text-sm text-gray-700 leading-relaxed">{booking.notes}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price e Actions row */}
                  <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-100">
                    {/* Price */}
                    {booking.service?.price && (
                      <div className="text-base sm:text-lg font-semibold text-primary-600 order-2 sm:order-1">
                        Prezzo: €{booking.service.price}
                      </div>
                    )}

                    {/* Actions - Mobile optimized */}
                    <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3 order-1 sm:order-2">
                      {/* Status badges per mobile */}
                      <div className="flex items-center space-x-2 sm:hidden">
                        {canModifyBooking(booking) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            Modificabile
                          </span>
                        )}
                        
                        {!canModifyBooking(booking) && !canCancelBooking(booking) && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            Non modificabile
                          </span>
                        )}
                      </div>

                      {/* Action buttons - Responsive sizing */}
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {/* Visualizza dettagli */}
                        <div className="tooltip-container">
                          <button 
                            onClick={() => handleViewBooking(booking)}
                            className="action-button p-2 sm:p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation"
                          >
                            <Eye className="w-5 h-5 sm:w-4 sm:h-4" />
                          </button>
                          <div className="tooltip">Visualizza dettagli</div>
                        </div>
                        
                        {/* Modifica */}
                        <div className="tooltip-container">
                          {canModifyBooking(booking) ? (
                            <button 
                              onClick={() => handleModifyBooking(booking)}
                              className="action-button p-2 sm:p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation"
                            >
                              <Edit3 className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                          ) : (
                            <button 
                              className="action-button p-2 sm:p-2.5 text-gray-300 cursor-not-allowed rounded-lg"
                              disabled
                            >
                              <Edit3 className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                          <div className="tooltip">
                            {canModifyBooking(booking) ? 'Modifica prenotazione' : 'Non modificabile (meno di 48 ore)'}
                          </div>
                        </div>
                        
                        {/* Cancella */}
                        <div className="tooltip-container">
                          {canCancelBooking(booking) ? (
                            <button 
                              onClick={() => handleCancelBooking(booking.id)}
                              className="action-button p-2 sm:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 touch-manipulation"
                            >
                              <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                          ) : (
                            <button 
                              className="action-button p-2 sm:p-2.5 text-gray-300 cursor-not-allowed rounded-lg"
                              disabled
                            >
                              <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                          <div className="tooltip">
                            {canCancelBooking(booking) ? 'Annulla prenotazione' : 'Non annullabile (meno di 48 ore)'}
                          </div>
                        </div>

                        {/* Contatta studio */}
                        {booking.status === 'CONFIRMED' && (
                          <div className="tooltip-container">
                            <button 
                              onClick={() => handleContactSupport(booking)}
                              className="action-button p-2 sm:p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 touch-manipulation"
                            >
                              <Phone className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                            <div className="tooltip">Contatta lo studio</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <AnimatedCard delay={200}>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {filterStatus === 'all' 
                  ? 'Nessuna prenotazione trovata'
                  : `Nessuna prenotazione ${filterStatus === 'CONFIRMED' ? 'confermata' : 
                      filterStatus === 'PENDING' ? 'in attesa' :
                      filterStatus === 'COMPLETED' ? 'completata' : 'annullata'}`
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === 'all' 
                  ? 'Inizia prenotando la tua prima sessione'
                  : 'Cambia filtro per vedere altre prenotazioni'
                }
              </p>
              <Link to="/prenota" className="btn-primary">
                Prenota ora
              </Link>
            </div>
          </AnimatedCard>
        )}
      </div>

      {/* Modali */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedBooking(null);
        }}
      />

      <BookingModifyModal
        booking={selectedBooking}
        isOpen={modifyModalOpen}
        onClose={() => {
          setModifyModalOpen(false);
          setSelectedBooking(null);
        }}
        onSave={handleSaveBooking}
      />

      {/* Notifiche */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}

      {/* Dialog di conferma */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.type}
      />
    </div>
  );
};

// Aggiungiamo stili responsive per touch-friendly interaction
const additionalStyles = `
  .action-button {
    min-width: 40px;
    min-height: 40px;
  }
  
  @media (max-width: 640px) {
    .action-button {
      min-width: 44px;
      min-height: 44px;
    }
  }
  
  .tooltip {
    z-index: 50;
    font-size: 0.75rem;
    white-space: nowrap;
  }
  
  @media (max-width: 640px) {
    .tooltip {
      font-size: 0.7rem;
    }
  }
  
  .touch-manipulation {
    touch-action: manipulation;
  }
`;

// Aggiungiamo gli stili al documento
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = additionalStyles;
  if (!document.head.querySelector('style[data-booking-styles]')) {
    styleElement.setAttribute('data-booking-styles', 'true');
    document.head.appendChild(styleElement);
  }
}

export default BookingsPage;
