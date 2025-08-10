import { useState } from 'react';

export interface ApiError {
  status?: number;
  message: string;
  type: 'network' | 'server' | 'validation' | 'auth' | 'generic';
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = (error: any): ApiError => {
    let apiError: ApiError;

    if (!navigator.onLine) {
      apiError = {
        status: 0,
        message: 'Connessione internet non disponibile',
        type: 'network'
      };
    } else if (error?.response) {
      const status = error.response.status;
      
      switch (status) {
        case 400:
          apiError = {
            status,
            message: error.response.data?.message || 'Richiesta non valida',
            type: 'validation'
          };
          break;
        case 401:
          apiError = {
            status,
            message: 'Sessione scaduta. Effettua nuovamente il login',
            type: 'auth'
          };
          break;
        case 403:
          apiError = {
            status,
            message: 'Non hai i permessi per questa operazione',
            type: 'auth'
          };
          break;
        case 404:
          apiError = {
            status,
            message: 'Risorsa non trovata',
            type: 'server'
          };
          break;
        case 422:
          apiError = {
            status,
            message: error.response.data?.message || 'Dati non validi',
            type: 'validation'
          };
          break;
        case 500:
          apiError = {
            status,
            message: 'Errore interno del server. Riprova più tardi',
            type: 'server'
          };
          break;
        case 502:
        case 503:
        case 504:
          apiError = {
            status,
            message: 'Servizio temporaneamente non disponibile',
            type: 'server'
          };
          break;
        default:
          apiError = {
            status,
            message: error.response.data?.message || 'Si è verificato un errore',
            type: 'server'
          };
      }
    } else if (error?.request) {
      apiError = {
        status: 0,
        message: 'Impossibile contattare il server. Controlla la connessione',
        type: 'network'
      };
    } else {
      apiError = {
        message: error?.message || 'Si è verificato un errore imprevisto',
        type: 'generic'
      };
    }

    setError(apiError);
    return apiError;
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    isLoading,
    setIsLoading,
    handleError,
    clearError
  };
};

export default useErrorHandler;
