import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Stethoscope, FileText, CheckCircle, XCircle, AlertTriangle, Euro, CreditCard } from 'lucide-react';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    clientName: string;
    clientEmail: string;
    service: string;
    date: string;
    time: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
    therapist: string;
    price?: number;
    notes?: string;
    createdAt: string;
    // Nuovi campi per pagamento
    amount?: number;
    isPaid?: boolean;
    paymentDate?: string;
    paymentMethod?: string;
  } | null;
  onStatusUpdate: (bookingId: string, status: string, updates: {
    notes?: string;
    amount?: number;
    isPaid?: boolean;
    paymentMethod?: string;
  }) => Promise<void>;
  canModify?: boolean;
}

const BookingDetailsModal = ({ isOpen, onClose, booking, onStatusUpdate, canModify = true }: BookingDetailsModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  // Inizializza i valori quando si apre il modal
  useEffect(() => {
    if (booking && isOpen) {
      setCustomAmount(booking.amount?.toString() || booking.price?.toString() || '');
      setIsPaid(booking.isPaid || false);
      setPaymentMethod(booking.paymentMethod || '');
    }
  }, [booking, isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible || !booking) return null;

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
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    setIsUpdating(true);
    try {
      const updates = {
        notes: additionalNotes || undefined,
        amount: customAmount ? parseFloat(customAmount) : undefined,
        isPaid,
        paymentMethod: paymentMethod || undefined
      };

      await onStatusUpdate(booking.id, newStatus, updates);
      
      // Show success feedback
      setUpdateSuccess(true);
      
      // Reset form and close after success animation
      setTimeout(() => {
        setShowStatusForm(false);
        setNewStatus('');
        setAdditionalNotes('');
        setUpdateSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating booking status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Dettagli Prenotazione
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge Enhanced */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${getStatusColor(booking.status)} shadow-sm`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(booking.status)}
                <span className="capitalize">
                  {booking.status === 'PENDING' ? 'In Attesa' :
                   booking.status === 'CONFIRMED' ? 'Confermata' :
                   booking.status === 'COMPLETED' ? 'Completata' : 'Cancellata'}
                </span>
                {booking.status === 'PENDING' && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse ml-1"></div>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">ID Prenotazione</span>
              <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                #{booking.id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-600" />
              Informazioni Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Nome</label>
                <p className="mt-1 text-sm text-gray-900">{booking.clientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="mt-1 text-sm text-gray-900">{booking.clientEmail}</p>
              </div>
            </div>
          </div>

          {/* Appointment Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Dettagli Appuntamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Data</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(booking.date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Orario</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {booking.time}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Servizio</label>
                <p className="mt-1 text-sm text-gray-900">{booking.service}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Terapista</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <Stethoscope className="w-4 h-4 mr-1" />
                  {booking.therapist}
                </p>
              </div>
              {booking.price && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Prezzo</label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">€{booking.price}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-emerald-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
              Informazioni Pagamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Importo</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">
                  €{booking.amount || booking.price || 'Non specificato'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Stato Pagamento</label>
                <div className="mt-1 flex items-center space-x-2">
                  {booking.isPaid ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Pagato
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Non Pagato
                    </span>
                  )}
                </div>
              </div>
              {booking.paymentMethod && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Metodo di Pagamento</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {booking.paymentMethod === 'CASH' ? 'Contanti' :
                     booking.paymentMethod === 'CARD' ? 'Carta' :
                     booking.paymentMethod === 'TRANSFER' ? 'Bonifico' :
                     booking.paymentMethod}
                  </p>
                </div>
              )}
              {booking.paymentDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Data Pagamento</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(booking.paymentDate).toLocaleDateString('it-IT')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-yellow-600" />
                Note
              </h3>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Status Update Form */}
          {showStatusForm ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  Aggiorna Stato Prenotazione
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600 font-medium">In modifica</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Status Selection with Visual Cards */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Seleziona Nuovo Stato
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'PENDING', label: 'In Attesa', icon: Clock, color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700' },
                      { value: 'CONFIRMED', label: 'Confermata', icon: CheckCircle, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
                      { value: 'COMPLETED', label: 'Completata', icon: CheckCircle, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
                      { value: 'CANCELLED', label: 'Cancellata', icon: XCircle, color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setNewStatus(status.value)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                          newStatus === status.value 
                            ? `${status.bgColor} ${status.borderColor} ring-2 ring-${status.color}-400 ring-opacity-50 shadow-lg` 
                            : `bg-white border-gray-200 hover:${status.bgColor} hover:${status.borderColor}`
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <status.icon className={`w-5 h-5 ${newStatus === status.value ? status.textColor : 'text-gray-400'}`} />
                          <span className={`font-medium text-sm ${newStatus === status.value ? status.textColor : 'text-gray-600'}`}>
                            {status.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Section with Enhanced Design */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Note Aggiuntive
                    <span className="text-gray-400 font-normal ml-1">(opzionale)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Aggiungi dettagli sul cambio di stato, motivazioni o istruzioni specifiche..."
                      rows={4}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {additionalNotes.length}/500
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="bg-emerald-50 rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-emerald-600" />
                    Gestione Pagamento
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Importo Personalizzato */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Importo Finale
                        <span className="text-gray-400 font-normal ml-1">(€)</span>
                      </label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder={booking?.price?.toString() || "0.00"}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Metodo di Pagamento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Metodo di Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                      >
                        <option value="">Seleziona metodo</option>
                        <option value="CASH">Contanti</option>
                        <option value="CARD">Carta di Credito/Debito</option>
                        <option value="TRANSFER">Bonifico</option>
                        <option value="OTHER">Altro</option>
                      </select>
                    </div>
                  </div>

                  {/* Stato Pagamento */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-2 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
                      Pagamento ricevuto
                    </label>
                    {isPaid && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pagato
                      </span>
                    )}
                  </div>
                </div>

                {/* Success Message */}
                {updateSuccess && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-green-800 font-semibold">Stato aggiornato con successo!</p>
                        <p className="text-green-600 text-sm">La prenotazione è stata modificata correttamente.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons with Enhanced Design */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || isUpdating || updateSuccess}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform ${
                      updateSuccess
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105'
                        : !newStatus || isUpdating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                    }`}
                  >
                    {updateSuccess ? (
                      <>
                        <CheckCircle className="w-5 h-5 animate-pulse" />
                        <span>Aggiornamento Completato!</span>
                      </>
                    ) : isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Aggiornamento...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Conferma Aggiornamento</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowStatusForm(false);
                      setNewStatus('');
                      setAdditionalNotes('');
                    }}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Action Buttons
            <div className="flex flex-col sm:flex-row gap-3">
              {canModify && (
                <button
                  onClick={() => setShowStatusForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex-1 flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Aggiorna Stato</span>
                </button>
              )}
              <button
                onClick={handleClose}
                className={`bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${canModify ? 'flex-1' : 'w-full'}`}
              >
                Chiudi
              </button>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>Prenotazione creata il: {new Date(booking.createdAt).toLocaleString('it-IT')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
