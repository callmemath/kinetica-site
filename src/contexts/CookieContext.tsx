import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsent {
  preferences: CookiePreferences;
  timestamp: string;
  version: string;
}

interface CookieContextType {
  hasConsent: boolean;
  cookiePreferences: CookiePreferences | null;
  isAnalyticsAllowed: boolean;
  isMarketingAllowed: boolean;
  isPreferencesAllowed: boolean;
  updateConsent: (preferences: CookiePreferences) => void;
  clearConsent: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export const CookieProvider = ({ children }: { children: ReactNode }) => {
  const [hasConsent, setHasConsent] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    // Check for existing consent on mount
    const storedConsent = localStorage.getItem('cookieConsent');
    if (storedConsent) {
      try {
        const consent: CookieConsent = JSON.parse(storedConsent);
        setCookiePreferences(consent.preferences);
        setHasConsent(true);
        
        // Initialize services based on preferences
        initializeServices(consent.preferences);
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        // Clear invalid data
        localStorage.removeItem('cookieConsent');
      }
    }
  }, []);

  const initializeServices = (preferences: CookiePreferences) => {
    // Initialize Google Analytics if analytics are allowed
    if (preferences.analytics && typeof window !== 'undefined') {
      // Example: Initialize Google Analytics
      // gtag('config', 'GA_MEASUREMENT_ID');
      console.log('Analytics initialized');
    }

    // Initialize marketing tools if marketing cookies are allowed
    if (preferences.marketing && typeof window !== 'undefined') {
      // Example: Initialize Facebook Pixel, Google Ads, etc.
      console.log('Marketing tools initialized');
    }

    // Initialize preference-based features
    if (preferences.preferences && typeof window !== 'undefined') {
      // Example: Initialize theme preferences, language preferences, etc.
      console.log('Preference features initialized');
    }
  };

  const updateConsent = (preferences: CookiePreferences) => {
    const consent: CookieConsent = {
      preferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setCookiePreferences(preferences);
    setHasConsent(true);
    
    // Initialize or disable services based on new preferences
    initializeServices(preferences);
  };

  const clearConsent = () => {
    localStorage.removeItem('cookieConsent');
    setCookiePreferences(null);
    setHasConsent(false);
  };

  const value: CookieContextType = {
    hasConsent,
    cookiePreferences,
    isAnalyticsAllowed: cookiePreferences?.analytics || false,
    isMarketingAllowed: cookiePreferences?.marketing || false,
    isPreferencesAllowed: cookiePreferences?.preferences || false,
    updateConsent,
    clearConsent,
  };

  return (
    <CookieContext.Provider value={value}>
      {children}
    </CookieContext.Provider>
  );
};

export const useCookies = () => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookies must be used within a CookieProvider');
  }
  return context;
};

export default CookieProvider;
