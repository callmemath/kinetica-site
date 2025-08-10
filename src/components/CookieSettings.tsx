import { Cookie } from 'lucide-react';
import { useCookies } from '../contexts/CookieContext';

const CookieSettings = () => {
  const { cookiePreferences, clearConsent } = useCookies();

  const handleManageCookies = () => {
    // Reset consent to show the banner again
    clearConsent();
    // The banner will automatically appear because consent is cleared
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <Cookie className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900">
          Impostazioni Cookie
        </h3>
      </div>
      
      {cookiePreferences && (
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">Stato attuale delle tue preferenze:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`px-2 py-1 rounded ${cookiePreferences.necessary ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Necessari: {cookiePreferences.necessary ? 'Attivi' : 'Disattivi'}
            </div>
            <div className={`px-2 py-1 rounded ${cookiePreferences.analytics ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Analitici: {cookiePreferences.analytics ? 'Attivi' : 'Disattivi'}
            </div>
            <div className={`px-2 py-1 rounded ${cookiePreferences.preferences ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Preferenze: {cookiePreferences.preferences ? 'Attivi' : 'Disattivi'}
            </div>
            <div className={`px-2 py-1 rounded ${cookiePreferences.marketing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Marketing: {cookiePreferences.marketing ? 'Attivi' : 'Disattivi'}
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={handleManageCookies}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
      >
        Modifica Preferenze Cookie
      </button>
    </div>
  );
};

export default CookieSettings;
