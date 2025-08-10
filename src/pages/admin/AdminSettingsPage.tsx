import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../contexts/ToastContext';
import { useStudioSettings } from '../../hooks/useStudioSettings';
import { apiService } from '../../services/api';
import type { StudioSettings } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Settings,
  Clock,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const { refresh: refreshStudioSettings } = useStudioSettings();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StudioSettings>({
    studioName: '',
    studioDescription: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    openingHours: {
      monday: { open: '08:00', close: '19:00', closed: false },
      tuesday: { open: '08:00', close: '19:00', closed: false },
      wednesday: { open: '08:00', close: '19:00', closed: false },
      thursday: { open: '08:00', close: '19:00', closed: false },
      friday: { open: '08:00', close: '19:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
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
  });

  // Check admin permissions
  const isAdmin = (user: any) => {
    if (!user || !user.role) return false;
    const userRole = user.role.toLowerCase();
    return userRole === 'admin';
  };

  useEffect(() => {
    if (isLoading) return;
    
    if (!user || !isAdmin(user)) {
      console.log('AdminSettingsPage - Redirecting to home page, user not authorized');
      navigate('/');
      return;
    }
    loadSettings();
  }, [user, navigate, isLoading]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStudioSettings();
      
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        throw new Error(response.message || 'Errore nel recupero delle impostazioni');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showError('Errore', 'Impossibile caricare le impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiService.updateStudioSettings(settings);
      
      if (response.success) {
        showSuccess('Impostazioni salvate', 'Le modifiche sono state applicate');
        if (response.data) {
          setSettings(response.data);
        }
        // Aggiorna anche il context globale delle impostazioni
        await refreshStudioSettings();
      } else {
        throw new Error(response.message || 'Errore nel salvataggio');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showError('Errore', error.message || 'Impossibile salvare le impostazioni');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const dayLabels = {
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  };

  // Don't render anything if user doesn't have permissions
  if (!user || !isAdmin(user)) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header stile utenti */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Impostazioni Studio</h1>
                <p className="text-primary-100">Configurazione generale del centro</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadSettings}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Aggiorna</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Salvando...' : 'Salva'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Informazioni Studio */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Informazioni Studio
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Studio
                </label>
                <input
                  type="text"
                  value={settings.studioName}
                  onChange={(e) => updateSetting('studioName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={settings.studioDescription}
                  onChange={(e) => updateSetting('studioDescription', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => updateSetting('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Città
                  </label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => updateSetting('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Sito Web
                </label>
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => updateSetting('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Orari di Apertura */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              Orari di Apertura
            </h3>
            <div className="space-y-3">
              {Object.entries(settings.openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-3">
                  <div className="w-20 text-sm font-medium text-gray-700">
                    {dayLabels[day as keyof typeof dayLabels]}
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => updateSetting(`openingHours.${day}.closed`, !e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    {!hours.closed && (
                      <>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateSetting(`openingHours.${day}.open`, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateSetting(`openingHours.${day}.close`, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </>
                    )}
                    {hours.closed && (
                      <span className="text-red-500 text-sm">Chiuso</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impostazioni Prenotazioni */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Impostazioni Prenotazioni
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max giorni in anticipo
                  </label>
                  <input
                    type="number"
                    value={settings.bookingSettings.maxAdvanceBookingDays}
                    onChange={(e) => updateSetting('bookingSettings.maxAdvanceBookingDays', parseInt(e.target.value))}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min ore in anticipo
                  </label>
                  <input
                    type="number"
                    value={settings.bookingSettings.minAdvanceBookingHours}
                    onChange={(e) => updateSetting('bookingSettings.minAdvanceBookingHours', parseInt(e.target.value))}
                    min="0"
                    max="72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ore cancellazione gratuita
                </label>
                <input
                  type="number"
                  value={settings.bookingSettings.cancellationHours}
                  onChange={(e) => updateSetting('bookingSettings.cancellationHours', parseInt(e.target.value))}
                  min="0"
                  max="168"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-4">
                {/* Switch per prenotazioni online */}
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="allowOnlineBooking" className="text-sm font-medium text-gray-700">
                      Consenti prenotazioni online
                    </label>
                    <p className="text-xs text-gray-500">
                      Permetti ai clienti di prenotare direttamente dal sito
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('bookingSettings.allowOnlineBooking', !settings.bookingSettings.allowOnlineBooking)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      settings.bookingSettings.allowOnlineBooking ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={settings.bookingSettings.allowOnlineBooking}
                    aria-labelledby="allowOnlineBooking"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                        settings.bookingSettings.allowOnlineBooking ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tema e Personalizzazione */}
                    {/* Tema e Personalizzazione */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Tema e Personalizzazione
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore Primario
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.themeSettings.primaryColor}
                      onChange={(e) => updateSetting('themeSettings.primaryColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.themeSettings.primaryColor}
                      onChange={(e) => updateSetting('themeSettings.primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#3da4db"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore Secondario
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.themeSettings.secondaryColor}
                      onChange={(e) => updateSetting('themeSettings.secondaryColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.themeSettings.secondaryColor}
                      onChange={(e) => updateSetting('themeSettings.secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#64748b"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Logo
                  </label>
                  <input
                    type="url"
                    value={settings.themeSettings.logoUrl}
                    onChange={(e) => updateSetting('themeSettings.logoUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    value={settings.themeSettings.favicon}
                    onChange={(e) => updateSetting('themeSettings.favicon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Social Media
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Gestisci i link ai tuoi profili social
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.socialMedia.facebookUrl}
                    onChange={(e) => updateSetting('socialMedia.facebookUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={settings.socialMedia.instagramUrl}
                    onChange={(e) => updateSetting('socialMedia.instagramUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter / X
                  </label>
                  <input
                    type="url"
                    value={settings.socialMedia.twitterUrl}
                    onChange={(e) => updateSetting('socialMedia.twitterUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://twitter.com/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={settings.socialMedia.linkedinUrl}
                    onChange={(e) => updateSetting('socialMedia.linkedinUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={settings.socialMedia.youtubeUrl}
                    onChange={(e) => updateSetting('socialMedia.youtubeUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://youtube.com/c/yourchannel"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
