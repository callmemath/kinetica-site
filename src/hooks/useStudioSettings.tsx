import { useState, useEffect, useContext, createContext } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';
import type { StudioSettings } from '../services/api';

// Interfaccia per il context
interface StudioSettingsContextType {
  settings: StudioSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Context
const StudioSettingsContext = createContext<StudioSettingsContextType | undefined>(undefined);

// Provider component
interface StudioSettingsProviderProps {
  children: ReactNode;
}

export const StudioSettingsProvider = ({ children }: StudioSettingsProviderProps) => {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getStudioSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        return;
      } else {
        throw new Error(response.message || 'Errore nel caricamento delle impostazioni');
      }
    } catch (err) {
      // Controlla se è un errore di autorizzazione (403)
      const isAuthError = err instanceof Error && (
        err.message.includes('Accesso riservato agli amministratori') ||
        err.message.includes('403') ||
        err.message.includes('Forbidden')
      );
      
      // Per errori di autorizzazione, non logghiamo l'errore in console (è normale per staff/user)
      if (!isAuthError) {
        console.error('Errore nel caricamento delle impostazioni dello studio:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      }
      
      // Sempre fallback ai dati di default per utenti non-admin o in caso di errore
      const fallbackSettings: StudioSettings = {
        studioName: 'Kinetica Fisioterapia Genova',
        studioDescription: 'Centro di fisioterapia e riabilitazione a Genova',
        address: 'Via Giovanni Tommaso Invrea 20/2',
        city: 'Genova',
        phone: '010 817 6855',
        email: 'amministrazione.kinetica@gmail.com',
        website: 'www.kineticafisioterapia.com',
        openingHours: {
          monday: { open: '08:00', close: '20:00', closed: false },
          tuesday: { open: '08:00', close: '20:00', closed: false },
          wednesday: { open: '08:00', close: '20:00', closed: false },
          thursday: { open: '08:00', close: '20:00', closed: false },
          friday: { open: '08:00', close: '20:00', closed: false },
          saturday: { open: '08:00', close: '13:00', closed: true },
          sunday: { open: '09:00', close: '12:00', closed: true }
        },
        bookingSettings: {
          maxAdvanceBookingDays: 60,
          minAdvanceBookingHours: 2,
          cancellationHours: 24,
          allowOnlineBooking: true,
          requirePaymentUpfront: false,
          sendConfirmationEmail: true,
          sendReminderEmail: true,
          reminderHours: 24
        },
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          newBookingAlert: true,
          cancellationAlert: true,
          reminderAlert: true
        },
        themeSettings: {
          primaryColor: '#3da4db',
          secondaryColor: '#64748b',
          logoUrl: '',
          favicon: ''
        },
        socialMedia: {
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
          linkedinUrl: '',
          youtubeUrl: ''
        }
      };
      setSettings(fallbackSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const refresh = async () => {
    await loadSettings();
  };

  const contextValue: StudioSettingsContextType = {
    settings,
    loading,
    error,
    refresh
  };

  return (
    <StudioSettingsContext.Provider value={contextValue}>
      {children}
    </StudioSettingsContext.Provider>
  );
};

// Hook per utilizzare il context
export const useStudioSettings = (): StudioSettingsContextType => {
  const context = useContext(StudioSettingsContext);
  if (context === undefined) {
    throw new Error('useStudioSettings deve essere utilizzato all\'interno di StudioSettingsProvider');
  }
  return context;
};
