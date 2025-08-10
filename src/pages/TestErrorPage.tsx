import React, { useState } from 'react';
import { AlertTriangle, Bug, Zap, RefreshCw } from 'lucide-react';

// Componente che genera l'errore durante il render
const ErrorGenerator: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  console.log('ErrorGenerator render, shouldThrow:', shouldThrow);
  
  if (shouldThrow) {
    console.log('About to throw error...');
    // Errore sincrono durante il render che dovrebbe essere catturato dall'ErrorBoundary
    throw new Error('Test error JavaScript catturato dall\'ErrorBoundary!');
  }
  
  return null;
};

const TestErrorPage: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  const triggerError = () => {
    console.log('Triggering error...');
    setShouldThrow(true);
  };

  const resetError = () => {
    console.log('Resetting error state...');
    setShouldThrow(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <ErrorGenerator shouldThrow={shouldThrow} />
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Bug className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Test Error Boundary
            </h1>
            <p className="text-gray-600">
              Questa pagina è disponibile solo in development per testare il sistema di gestione errori.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Attenzione
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Cliccando il pulsante sottostante verrà generato un errore JavaScript
                    che dovrebbe essere catturato dall'ErrorBoundary e mostrare la pagina di errore personalizzata.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={triggerError}
                disabled={shouldThrow}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Zap className="h-5 w-5" />
                <span>Genera Errore</span>
              </button>

              <button
                onClick={resetError}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Dopo aver cliccato "Genera Errore", dovresti vedere la pagina di errore personalizzata
                con la possibilità di riprovare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestErrorPage;