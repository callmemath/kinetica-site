import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings, Check, Shield, Eye } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      }, 1000); // Show after 1 second
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    
    saveCookiePreferences(allAccepted);
    closeBanner();
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    
    saveCookiePreferences(onlyNecessary);
    closeBanner();
  };

  const handleSavePreferences = () => {
    saveCookiePreferences(preferences);
    closeBanner();
  };

  const saveCookiePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));

    // Trigger analytics or marketing scripts based on preferences
    if (prefs.analytics) {
      // Initialize analytics (Google Analytics, etc.)
      console.log('Analytics cookies enabled');
    }
    
    if (prefs.marketing) {
      // Initialize marketing cookies
      console.log('Marketing cookies enabled');
    }
    
    if (prefs.preferences) {
      // Initialize preference cookies
      console.log('Preference cookies enabled');
    }
  };

  const closeBanner = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      setShowSettings(false);
    }, 300);
  };

  const handlePreferenceChange = (type: keyof CookiePreferences) => {
    if (type === 'necessary') return; // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isVisible) return null;

  const cookieTypes = [
    {
      key: 'necessary' as keyof CookiePreferences,
      title: 'Cookie Necessari',
      description: 'Essenziali per il funzionamento del sito web. Non possono essere disabilitati.',
      icon: Shield,
      required: true
    },
    {
      key: 'analytics' as keyof CookiePreferences,
      title: 'Cookie Analitici',
      description: 'Ci aiutano a capire come i visitatori interagiscono con il nostro sito web.',
      icon: Eye,
      required: false
    },
    {
      key: 'preferences' as keyof CookiePreferences,
      title: 'Cookie delle Preferenze',
      description: 'Memorizzano le tue preferenze e personalizzano la tua esperienza.',
      icon: Settings,
      required: false
    },
    {
      key: 'marketing' as keyof CookiePreferences,
      title: 'Cookie di Marketing',
      description: 'Utilizzati per tracciare i visitatori sui siti web per mostrare annunci pertinenti.',
      icon: Cookie,
      required: false
    }
  ];

  return (
    <div 
      className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end justify-center p-4 transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden transition-all duration-300 transform ${
          isAnimating ? 'translate-y-0 scale-100' : 'translate-y-full scale-95'
        }`}
      >
        {!showSettings ? (
          // Main banner
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-full">
                  <Cookie className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Utilizziamo i Cookie
                  </h3>
                  <p className="text-sm text-gray-600">
                    Per migliorare la tua esperienza sul nostro sito
                  </p>
                </div>
              </div>
              <button
                onClick={closeBanner}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza di navigazione, 
                analizzare il traffico del sito e personalizzare i contenuti. Puoi scegliere quali 
                categorie di cookie accettare. I cookie necessari sono sempre attivi per garantire 
                il funzionamento del sito.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Privacy Policy:</strong> Per maggiori informazioni su come utilizziamo i tuoi dati, 
                consulta la nostra{' '}
                <Link to="/privacy-policy" className="underline hover:no-underline">
                  Informativa sulla Privacy
                </Link>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptAll}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Accetta Tutti
              </button>
              
              <button
                onClick={handleRejectAll}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex-1"
              >
                Solo Necessari
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 transition-colors flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Personalizza
              </button>
            </div>
          </div>
        ) : (
          // Settings panel
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-full">
                  <Settings className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Impostazioni Cookie
                </h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {cookieTypes.map((cookieType) => {
                const Icon = cookieType.icon;
                const isEnabled = preferences[cookieType.key];
                
                return (
                  <div key={cookieType.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              {cookieType.title}
                            </h4>
                            <div className="flex items-center">
                              {cookieType.required && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mr-3">
                                  Richiesto
                                </span>
                              )}
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => handlePreferenceChange(cookieType.key)}
                                  disabled={cookieType.required}
                                  className="sr-only peer"
                                />
                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer transition-colors ${
                                  isEnabled ? 'peer-checked:bg-primary-600' : ''
                                } ${cookieType.required ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  <div className={`dot absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${
                                    isEnabled ? 'translate-x-full border-white' : ''
                                  }`}></div>
                                </div>
                              </label>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {cookieType.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSavePreferences}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Salva Preferenze
              </button>
              
              <button
                onClick={handleAcceptAll}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1"
              >
                Accetta Tutti
              </button>
              
              <button
                onClick={() => setShowSettings(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieBanner;
