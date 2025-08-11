import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Linkedin, Youtube, Globe } from 'lucide-react';
import { useStudioSettings } from '../hooks/useStudioSettings';

const Footer = () => {
  const { settings } = useStudioSettings();

  // Funzioni di formattazione inline
  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  const formatPhoneLink = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const generateMapsLink = () => {
    if (!settings) return '#';
    const address = `${settings.address}, ${settings.city}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const formatEmailLink = (email: string) => {
    return `mailto:${email}`;
  };

  if (!settings) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="container-max px-4 sm:px-6">
          <div className="py-12 text-center">
            <p className="text-gray-400">Caricamento...</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-max px-4 sm:px-6">
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8">
            {/* Logo e descrizione */}
            <div className="space-y-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="/logo.png" 
                    alt="Kinetica Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{settings.studioName}</h2>
                  <p className="text-sm text-gray-400">{settings.studioDescription}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
                {settings.studioDescription}
              </p>
            </div>

            {/* Link utili */}
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-lg mb-4">Link Utili</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/chi-siamo" className="text-gray-400 hover:text-primary-400 transition-colors">
                    Chi Siamo
                  </Link>
                </li>
                <li>
                  <Link to="/servizi" className="text-gray-400 hover:text-primary-400 transition-colors">
                    I Nostri Servizi
                  </Link>
                </li>
                <li>
                  <Link to="/collaborazioni" className="text-gray-400 hover:text-primary-400 transition-colors">
                    Collaborazioni
                  </Link>
                </li>
                <li>
                  <Link to="/prenota" className="text-gray-400 hover:text-primary-400 transition-colors">
                    Prenota Online
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contatti */}
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-lg mb-4">Contatti</h3>
              <ul className="space-y-3">
                <li className="flex items-start justify-center sm:justify-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <a 
                    href={generateMapsLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm text-left"
                  >
                    {settings.address}<br />
                    {settings.city}
                  </a>
                </li>
                <li className="flex items-center justify-center sm:justify-start space-x-3">
                  <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <a 
                    href={`tel:${formatPhoneLink(settings.phone)}`}
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    {formatPhone(settings.phone)}
                  </a>
                </li>
                <li className="flex items-center justify-center sm:justify-start space-x-3">
                  <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <a 
                    href={formatEmailLink(settings.email)}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {settings.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Orari e Social */}
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-lg mb-4">Orari</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-start justify-center sm:justify-start space-x-3">
                  <Clock className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div className="text-gray-400 text-sm text-left">
                    <p>Lun-Ven: {settings.openingHours.monday.open} - {settings.openingHours.friday.close}</p>
                    <p>Sabato: {settings.openingHours.saturday.closed ? 'Chiuso' : `${settings.openingHours.saturday.open} - ${settings.openingHours.saturday.close}`}</p>
                    <p>Domenica: {settings.openingHours.sunday.closed ? 'Chiuso' : `${settings.openingHours.sunday.open} - ${settings.openingHours.sunday.close}`}</p>
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold mb-3">Seguici</h4>
              <div className="flex justify-center sm:justify-start space-x-4">
                {/* Sito Web */}
                {settings.website && (
                  <a
                    href={settings.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                    title="Sito Web"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                
                {/* Social Media */}
                {settings.socialMedia?.facebookUrl && (
                  <a
                    href={settings.socialMedia.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                    title="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                
                {settings.socialMedia?.instagramUrl && (
                  <a
                    href={settings.socialMedia.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-pink-500 transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                
                {settings.socialMedia?.twitterUrl && (
                  <a
                    href={settings.socialMedia.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    title="Twitter/X"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                
                {settings.socialMedia?.linkedinUrl && (
                  <a
                    href={settings.socialMedia.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                
                {settings.socialMedia?.youtubeUrl && (
                  <a
                    href={settings.socialMedia.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="YouTube"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; 2025 {settings.studioName}. Tutti i diritti riservati.</p>
            <p className="mt-2">
              <Link to="/privacy-policy" className="hover:text-primary-400 transition-colors">
                Privacy Policy
              </Link>
              {' | '}
              <Link to="/termini" className="hover:text-primary-400 transition-colors">
                Termini di Servizio
              </Link>
              {' | '}
              <Link to="/cookie-policy" className="hover:text-primary-400 transition-colors">
                Cookie Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;