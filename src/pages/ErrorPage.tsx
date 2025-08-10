import { 
  Home, 
  RefreshCw,
  AlertCircle,
  Wifi,
  Server,
  HelpCircle
} from 'lucide-react';

interface ErrorPageProps {
  error?: {
    status?: number;
    message?: string;
    type?: 'network' | 'server' | 'generic';
  };
  onRetry?: () => void;
}

const ErrorPage = ({ 
  error = { 
    status: 500, 
    message: 'Si è verificato un errore imprevisto',
    type: 'generic'
  },
  onRetry 
}: ErrorPageProps) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <Wifi className="w-20 h-20 md:w-24 h-24 text-gray-500" />;
      case 'server':
        return <Server className="w-20 h-20 md:w-24 h-24 text-gray-500" />;
      default:
        return <AlertCircle className="w-20 h-20 md:w-24 h-24 text-gray-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.status) {
      case 400:
        return 'Richiesta non valida';
      case 401:
        return 'Accesso non autorizzato';
      case 403:
        return 'Accesso negato';
      case 500:
        return 'Errore del server';
      case 502:
        return 'Servizio non disponibile';
      case 503:
        return 'Servizio temporaneamente non disponibile';
      default:
        return 'Si è verificato un errore';
    }
  };

  const getErrorDescription = () => {
    switch (error.type) {
      case 'network':
        return 'Controlla la tua connessione internet e riprova';
      case 'server':
        return 'I nostri server stanno avendo problemi. Riprova tra qualche minuto';
      default:
        return error.message || 'Qualcosa è andato storto. Il nostro team è stato notificato';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icona errore */}
        <div className="mb-8 flex justify-center">
          {getErrorIcon()}
        </div>

        {/* Codice errore */}
        <div className="mb-6">
          <span className="text-6xl md:text-8xl font-bold text-gray-700">
            {error.status}
          </span>
        </div>

        {/* Messaggio principale */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {getErrorTitle()}
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {getErrorDescription()}
          </p>
        </div>

        {/* Azioni */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Riprova
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Torna alla Home
          </button>
        </div>

        {/* Suggerimenti */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 mr-2 text-primary-600" />
            Cosa puoi fare?
          </h3>
          
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Controlla la tua connessione internet</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Ricarica la pagina (F5 o Ctrl+R)</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Pulisci la cache del browser</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Riprova tra qualche minuto</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Se il problema persiste, contattaci a{' '}
              <a 
                href="mailto:info@kineticafisioterapia.com" 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                info@kineticafisioterapia.com
              </a>
              {' '}o chiama il{' '}
              <a 
                href="tel:+390101234567" 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                +39 010 123 4567
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
