import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, MessageSquare, CheckCircle, Stethoscope, Heart, Activity, Zap, Star, Sparkles, Users } from 'lucide-react';
import { apiService, type Staff, type CreateBookingData } from '../services/api';
import { type Service, type Category } from '../types';
import { useAuth } from '../hooks/useAuth';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedText from '../components/AnimatedText';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAvailableTimeSlotsForService, isServiceAvailable, calculateEndTime } from '../utils/serviceAvailability';

interface BookingFormData {
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  notes?: string;
}

const BookingPage = () => {
  const { user } = useAuth();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingFormData>();
  
  const [services, setServices] = useState<Service[]>([]);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State per gestire la disponibilità degli slot
  const [slotsAvailability, setSlotsAvailability] = useState<Record<string, boolean>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Helper function to check if a time slot is available
  // Helper function to get service icon
  const getServiceIcon = (categoryValue: string) => {
    const icons: Record<string, React.ReactElement> = {
      fisioterapia: <Stethoscope className="w-7 h-7" />,
      osteopatia: <Heart className="w-7 h-7" />,
      riabilitazione: <Activity className="w-7 h-7" />,
      ginnastica: <Zap className="w-7 h-7" />,
      pilates: <Star className="w-7 h-7" />,
      massaggio: <Sparkles className="w-7 h-7" />,
      wellness: <Users className="w-7 h-7" />,
    };
    return icons[categoryValue] || <Stethoscope className="w-7 h-7" />;
  };

  // Funzioni dinamiche per colori basate sui dati di categoria dal database
  const getServiceColor = (category?: Category): string => {
    if (!category?.color) return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg';
    return `text-white shadow-lg`;
  };

  const getServiceColorStyle = (category?: Category): React.CSSProperties => {
    if (!category?.color) return { background: 'linear-gradient(to bottom right, #6b7280, #4b5563)' };
    const color = category.color;
    return { background: `linear-gradient(to bottom right, ${color}, ${adjustBrightness(color, -20)})` };
  };

  const getServiceCardTheme = (category?: Category): string => {
    if (!category?.color) return 'border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-100 hover:border-gray-400 hover:shadow-gray-200/50';
    return `hover:shadow-xl`;
  };

  const getServiceCardStyle = (category?: Category): React.CSSProperties => {
    if (!category?.color) return {};
    const lightColor = adjustBrightness(category.color, 80);
    const veryLightColor = adjustBrightness(category.color, 90);
    return {
      borderColor: adjustBrightness(category.color, 60),
      background: `linear-gradient(to bottom right, ${veryLightColor}, white, ${lightColor})`
    };
  };

  const getServiceSelectedTheme = (category?: Category): string => {
    if (!category?.color) return 'border-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 shadow-gray-300/50';
    return `shadow-xl`;
  };

  const getServiceSelectedStyle = (category?: Category): React.CSSProperties => {
    if (!category?.color) return {};
    const lightColor = adjustBrightness(category.color, 70);
    const mediumColor = adjustBrightness(category.color, 50);
    return {
      borderColor: category.color,
      background: `linear-gradient(to bottom right, ${lightColor}, ${mediumColor})`,
      boxShadow: `0 25px 50px -12px ${category.color}50`
    };
  };

  // Funzione helper per regolare la luminosità di un colore
  const adjustBrightness = (color: string, percent: number): string => {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + percent));
    const g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + percent));
    const b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + percent));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const isSlotAvailable = (time: string): boolean => {
    // Usa il nuovo sistema di disponibilità slot
    return slotsAvailability[time] !== false; // Default a true se non ancora caricato
  };

  // Carica i servizi all'avvio
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const response = await apiService.getServices();
        if (response.success && response.data) {
          setServices(response.data);
        }
      } catch (error) {
        console.error('Error loading services:', error);
        setError('Errore nel caricamento dei servizi');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  // Carica lo staff quando viene selezionato un servizio
  useEffect(() => {
    const loadStaff = async () => {
      if (!selectedService) {
        setAvailableStaff([]);
        return;
      }

      try {
        const response = await apiService.getStaffByService(selectedService.id);
        if (response.success && response.data) {
          setAvailableStaff(response.data);
        }
      } catch (error) {
        console.error('Error loading staff:', error);
        setError('Errore nel caricamento dello staff');
      }
    };

    loadStaff();
  }, [selectedService]);

  // Carica la disponibilità quando cambiano staff, servizio e data
  useEffect(() => {
    const loadAvailability = async () => {
      const selectedDate = watch('date');
      
      if (!selectedStaff || !selectedDate || !selectedService) {
        setSlotsAvailability({});
        setAvailableTimeSlots([]);
        return;
      }

      try {
        setLoadingAvailability(true);
        
        // Ensure date is properly formatted as YYYY-MM-DD
        const formattedDate = selectedDate.includes('-') ? selectedDate : 
          new Date(selectedDate).toISOString().split('T')[0];
        
        console.log('BookingPage - Loading availability for:', {
          selectedDate,
          formattedDate,
          serviceId: selectedService.id,
          staffId: selectedStaff.id,
          serviceAvailability: selectedService.availability
        });
        
        // 1. Prima ottieni gli orari disponibili per il servizio basati sulla sua configurazione
        const serviceTimeSlots = getAvailableTimeSlotsForService(
          selectedService.availability,
          formattedDate,
          selectedService.duration
        );
        
        setAvailableTimeSlots(serviceTimeSlots);
        
        // Se il servizio non ha orari disponibili per questo giorno, ferma qui
        if (serviceTimeSlots.length === 0) {
          setSlotsAvailability({});
          return;
        }
        
        // 2. Poi verifica la disponibilità dello staff per questi orari
        const response = await apiService.getAvailabilityWithBlocks(formattedDate, selectedService.id, selectedStaff.id);
        
        if (response.success && response.data && response.data.slots) {
          // Combina disponibilità del servizio con quella dello staff
          const availability: Record<string, boolean> = {};
          
          serviceTimeSlots.forEach(slot => {
            // Verifica se l'orario è disponibile secondo il servizio
            const endTime = calculateEndTime(slot, selectedService.duration);
            const serviceAvailable = isServiceAvailable(
              selectedService.availability,
              formattedDate,
              slot,
              endTime
            );
            
            // Verifica se lo staff è disponibile (dall'API)
            const staffSlot = response.data!.slots.find(s => s.time === slot);
            const staffAvailable = staffSlot ? staffSlot.available : false;
            
            // L'orario è disponibile solo se sia il servizio che lo staff sono disponibili
            availability[slot] = serviceAvailable && staffAvailable;
          });
          
          setSlotsAvailability(availability);
          console.log('BookingPage - Final availability object:', availability);
        } else {
          // Fallback: solo controllo disponibilità servizio
          const availability: Record<string, boolean> = {};
          serviceTimeSlots.forEach(slot => {
            const endTime = calculateEndTime(slot, selectedService.duration);
            availability[slot] = isServiceAvailable(
              selectedService.availability,
              formattedDate,
              slot,
              endTime
            );
          });
          setSlotsAvailability(availability);
        }
      } catch (error) {
        console.error('Error loading availability:', error);
        // In caso di errore, mostra solo gli orari del servizio senza filtro staff
        const serviceTimeSlots = getAvailableTimeSlotsForService(
          selectedService.availability,
          selectedDate,
          selectedService.duration
        );
        setAvailableTimeSlots(serviceTimeSlots);
        
        const availability: Record<string, boolean> = {};
        serviceTimeSlots.forEach(slot => {
          availability[slot] = true; // Assume disponibile in caso di errore
        });
        setSlotsAvailability(availability);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, [selectedStaff, selectedService, watch('date')]);

  // Completa automaticamente la prenotazione se l'utente arriva dal login
  useEffect(() => {
    const completePendingBooking = async () => {
      if (!user) return;

      const pendingBookingData = localStorage.getItem('pendingBooking');
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');

      if (pendingBookingData && action === 'complete-booking') {
        try {
          setSubmitting(true);
          const bookingData = JSON.parse(pendingBookingData);
          
          const response = await apiService.createBooking({
            serviceId: bookingData.serviceId,
            staffId: bookingData.staffId,
            date: bookingData.date,
            startTime: bookingData.startTime,
            notes: bookingData.notes
          });
          
          if (response.success) {
            localStorage.removeItem('pendingBooking');
            setSuccess(true);
            // Pulisci l'URL
            window.history.replaceState({}, '', '/prenota');
          } else {
            setError(response.message || 'Errore nella creazione della prenotazione');
          }
        } catch (error: any) {
          setError(error.message || 'Errore nella creazione della prenotazione');
        } finally {
          setSubmitting(false);
        }
      }
    };

    completePendingBooking();
  }, [user]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedStaff(null);
    setValue('serviceId', service.id);
    setValue('staffId', '');
  };

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setValue('staffId', staff.id);
  };

  // Reset dell'orario quando cambia la data
  const selectedDate = watch('date');
  useEffect(() => {
    if (selectedDate) {
      setValue('time', '');
    }
  }, [selectedDate, setValue]);

  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      // Salva i dati della prenotazione nel localStorage
      const pendingBooking = {
        serviceId: data.serviceId,
        staffId: data.staffId,
        date: data.date,
        startTime: data.time,
        notes: data.notes,
        serviceName: selectedService?.name,
        staffName: `${selectedStaff?.firstName} ${selectedStaff?.lastName}`,
        servicePrice: selectedService?.price,
        serviceDuration: selectedService?.duration
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
      
      // Reindirizza al login con un parametro per indicare che c'è una prenotazione in sospeso
      window.location.href = '/login?redirect=prenota&action=complete-booking';
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const bookingData: CreateBookingData = {
        serviceId: data.serviceId,
        staffId: data.staffId,
        date: data.date,
        startTime: data.time,
        notes: data.notes
      };

      const response = await apiService.createBooking(bookingData);
      
      if (response.success) {
        setSuccess(true);
        // Reset form dopo il successo
        setTimeout(() => {
          setSuccess(false);
          setSelectedService(null);
          setSelectedStaff(null);
          setValue('serviceId', '');
          setValue('staffId', '');
          setValue('date', '');
          setValue('time', '');
          setValue('notes', '');
        }, 3000);
      } else {
        setError(response.message || 'Errore nella creazione della prenotazione');
      }
    } catch (error: any) {
      setError(error.message || 'Errore nella creazione della prenotazione');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Mostra stato di completamento automatico
  const urlParams = new URLSearchParams(window.location.search);
  const isCompletingBooking = urlParams.get('action') === 'complete-booking' && submitting;
  
  if (isCompletingBooking) {
    const pendingBookingData = localStorage.getItem('pendingBooking');
    const pendingBooking = pendingBookingData ? JSON.parse(pendingBookingData) : null;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AnimatedCard className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Completamento Prenotazione</h2>
          <p className="text-gray-600 mb-4">
            Stiamo completando la tua prenotazione...
          </p>
          {pendingBooking && (
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Servizio:</span>
                  <span className="font-medium">{pendingBooking.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Professionista:</span>
                  <span className="font-medium">{pendingBooking.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">{pendingBooking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Orario:</span>
                  <span className="font-medium">{pendingBooking.startTime}</span>
                </div>
              </div>
            </div>
          )}
        </AnimatedCard>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AnimatedCard className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prenotazione Confermata!</h2>
          <p className="text-gray-600 mb-4">
            La tua prenotazione è stata inviata con successo. 
            Riceverai una conferma via email entro 24 ore.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="btn-primary"
          >
            Nuova Prenotazione
          </button>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Prenota il Tuo <AnimatedText text="Appuntamento" className="text-primary-600" delay={0} speed={30} />
            </h1>
            <p className="text-xl text-gray-600">
              Seleziona il servizio e l'orario che preferisci
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Select Service */}
            <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                  1
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Scegli il Servizio</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-105 active:scale-95 flex flex-col h-full ${
                      selectedService?.id === service.id
                        ? `${getServiceSelectedTheme(service.category)} ring-2 ring-offset-2 ring-primary-400`
                        : `${getServiceCardTheme(service.category)} hover:shadow-2xl`
                    }`}
                    style={selectedService?.id === service.id 
                      ? getServiceSelectedStyle(service.category)
                      : getServiceCardStyle(service.category)
                    }
                  >
                    <div 
                      className={`w-14 h-14 rounded-xl ${getServiceColor(service.category)} flex items-center justify-center mb-4 transform hover:rotate-12 transition-transform duration-300 flex-shrink-0`}
                      style={getServiceColorStyle(service.category)}
                    >
                      {getServiceIcon(service.category?.value || 'fisioterapia')}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg flex-shrink-0">{service.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed flex-grow">{service.description}</p>
                    <div className="flex justify-between items-center text-sm flex-shrink-0 mt-auto">
                      <span className="text-gray-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm">
                        ⏱️ {service.duration} min
                      </span>
                      <span className="font-bold text-lg bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                        €{service.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <input
                type="hidden"
                {...register('serviceId', { required: 'Seleziona un servizio' })}
                value={selectedService?.id || ''}
              />
              {errors.serviceId && (
                <p className="text-red-500 text-sm mt-2">{errors.serviceId.message}</p>
              )}
            </div>

            {/* Step 2: Select Staff */}
            {selectedService && (
              <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                    2
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Scegli il Professionista</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableStaff.map((staff) => (
                    <div
                      key={staff.id}
                      onClick={() => handleStaffSelect(staff)}
                      className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
                        selectedStaff?.id === staff.id
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-primary-300 bg-gradient-to-br from-white to-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                          selectedStaff?.id === staff.id 
                            ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg' 
                            : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                        }`}>
                          <span className="text-xl font-bold">
                            {staff.firstName?.[0]}{staff.lastName?.[0]}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {staff.firstName} {staff.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {staff.specialization}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <input
                  type="hidden"
                  {...register('staffId', { required: 'Seleziona un professionista' })}
                  value={selectedStaff?.id || ''}
                />
                {errors.staffId && (
                  <p className="text-red-500 text-sm mt-2">{errors.staffId.message}</p>
                )}
              </div>
            )}

            {/* Step 3: Select Date and Time */}
            {selectedStaff && (
              <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                    3
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Scegli Data e Orario</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Data
                    </label>
                    <input
                      type="date"
                      {...register('date', { required: 'Seleziona una data' })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-200"
                    />
                    {errors.date && (
                      <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Time Selection - Solo se la data è selezionata */}
                  {watch('date') ? (
                    <div className="animate-fade-in">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Orario disponibile per il {new Date(watch('date')).toLocaleDateString('it-IT', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                        {loadingAvailability && (
                          <span className="ml-2 text-xs text-gray-500">(Caricamento disponibilità...)</span>
                        )}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimeSlots.length === 0 && selectedService && watch('date') ? (
                          <div className="col-span-3 text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                            <p className="text-yellow-800 font-medium">Nessun orario disponibile</p>
                            <p className="text-yellow-600 text-sm mt-1">
                              Il servizio "{selectedService.name}" non è disponibile per prenotazioni in questa data.
                            </p>
                          </div>
                        ) : (
                          availableTimeSlots.map((slot) => {
                            const isAvailable = isSlotAvailable(slot);
                            const isSelected = watch('time') === slot;
                            
                            return (
                              <label key={slot} className={`${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                <input
                                  type="radio"
                                  {...register('time', { required: 'Seleziona un orario' })}
                                  value={slot}
                                  disabled={!isAvailable}
                                  className="sr-only"
                                />
                                <div className={`px-3 py-2 text-center text-sm rounded-lg border transition-all duration-200 ${
                                  !isAvailable
                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                    : isSelected
                                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-600 shadow-lg transform scale-105'
                                      : 'bg-gradient-to-r from-white to-gray-50 border-gray-300 hover:border-primary-300 hover:shadow-md hover:from-primary-50 hover:to-blue-50 transform hover:scale-102'
                                }`}>
                                  {slot}
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                      {errors.time && (
                        <p className="text-red-500 text-sm mt-2">{errors.time.message}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Seleziona prima una data</p>
                        <p className="text-xs">per vedere gli orari disponibili</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Additional Notes */}
            {watch('time') && (
              <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Note Aggiuntive</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Descrivi il problema o aggiungi informazioni utili (opzionale)
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={4}
                    placeholder="Es. Dolore al ginocchio destro dopo attività sportiva..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            {watch('time') && (
              <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Riepilogo Prenotazione
                  </h3>
                  {selectedService && selectedStaff && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <div className="space-y-2 text-left">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Servizio:</span>
                          <span className="font-medium">{selectedService.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Professionista:</span>
                          <span className="font-medium">{selectedStaff.firstName} {selectedStaff.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data:</span>
                          <span className="font-medium">{watch('date')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Orario:</span>
                          <span className="font-medium">{watch('time')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Durata:</span>
                          <span className="font-medium">{selectedService.duration} minuti</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Prezzo:</span>
                          <span className="font-bold text-primary-600">€{selectedService.price}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full sm:w-auto px-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5 mr-2" />
                        Conferma Prenotazione
                      </>
                    )}
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Riceverai una conferma via email entro 24 ore
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
