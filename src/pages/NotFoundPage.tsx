import React from 'react';
import { 
  Home, 
  ArrowLeft, 
  Search,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigateToHome = () => {
    window.location.href = '/';
  };

  const navigateToServices = () => {
    window.location.href = '/servizi';
  };

  const navigateToBooking = () => {
    window.location.href = '/prenota';
  };

  const navigateToContacts = () => {
    window.location.href = '/contatti';
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Numero 404 - dimensione bilanciata */}
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[220px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-300 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="w-20 h-20 md:w-28 h-28 text-primary-600 animate-bounce" />
          </div>
        </div>

        {/* Messaggio principale - dimensione bilanciata */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Oops! Pagina non trovata
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-2">
            La pagina che stai cercando non esiste o è stata spostata
          </p>
          <p className="text-gray-500">
            Non preoccuparti, ti aiutiamo a ritrovare la strada!
          </p>
        </div>

        {/* Azioni di navigazione - dimensione bilanciata */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button
            onClick={navigateToHome}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            Torna alla Home
          </button>
          
          <button
            onClick={goBack}
            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Pagina Precedente
          </button>
        </div>

        {/* Suggerimenti di navigazione - dimensione bilanciata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <button
            onClick={navigateToServices}
            className="p-5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 hover:border-blue-200 group w-full animate-fade-in-up"
            style={{ animationDelay: '500ms', animationFillMode: 'both' }}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Esplora i Servizi
            </h3>
            <p className="text-gray-600 text-sm">
              Scopri tutti i nostri trattamenti di fisioterapia e riabilitazione
            </p>
          </button>

          <button
            onClick={navigateToBooking}
            className="p-5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 hover:border-green-200 group w-full animate-fade-in-up"
            style={{ animationDelay: '600ms', animationFillMode: 'both' }}
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Prenota Visita
            </h3>
            <p className="text-gray-600 text-sm">
              Schedula un appuntamento con i nostri specialisti
            </p>
          </button>

          <button
            onClick={navigateToContacts}
            className="p-5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 hover:border-purple-200 group w-full animate-fade-in-up"
            style={{ animationDelay: '700ms', animationFillMode: 'both' }}
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Contattaci
            </h3>
            <p className="text-gray-600 text-sm">
              Hai domande? Il nostro team è qui per aiutarti
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
