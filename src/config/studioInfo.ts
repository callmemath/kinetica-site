/**
 * Configurazione centralizzata per tutte le informazioni dello studio
 * Modifica questo file per aggiornare le informazioni in tutta l'applicazione
 */

export const STUDIO_INFO = {
  // Informazioni generali
  name: 'Kinetica',
  fullName: 'Kinetica Fisioterapia Genova',
  tagline: 'Fisioterapia Genova',
  description: 'Centro di fisioterapia e riabilitazione a Genova',
  
  // Contatti
  contact: {
    phone: '010 817 6855',
    email: 'amministrazione.kinetica@gmail.com',
    website: 'www.kineticafisioterapia.com',
  },
  
  // Indirizzo
  address: {
    street: 'Via Giovanni Tommaso Invrea 20/2',
    city: 'Genova',
    province: 'GE',
    postalCode: '16129',
    country: 'Italia',
    // Indirizzo completo formattato
    get full() {
      return `${this.street}, ${this.postalCode} ${this.city} (${this.province})`;
    },
    // Per Google Maps
    get googleMapsQuery() {
      return `${this.street}, ${this.city}, ${this.province}, ${this.country}`;
    }
  },
  
  // Orari di apertura
  workingHours: {
    monday: { start: '08:00', end: '20:00' },
    tuesday: { start: '08:00', end: '20:00' },
    wednesday: { start: '08:00', end: '20:00' },
    thursday: { start: '08:00', end: '20:00' },
    friday: { start: '08:00', end: '20:00' },
    saturday: { closed: true },
    sunday: { closed: true },
    
    // Formattazione italiana
    get formatted() {
      return {
        'Lunedì - Venerdì': '8:00 - 20:00',
        'Sabato': 'Chiuso',
        'Domenica': 'Chiuso'
      };
    },
    
    // Lista dettagliata
    get detailed() {
      return [
        { day: 'Lunedì', hours: `${this.monday.start} - ${this.monday.end}` },
        { day: 'Martedì', hours: `${this.tuesday.start} - ${this.tuesday.end}` },
        { day: 'Mercoledì', hours: `${this.wednesday.start} - ${this.wednesday.end}` },
        { day: 'Giovedì', hours: `${this.thursday.start} - ${this.thursday.end}` },
        { day: 'Venerdì', hours: `${this.friday.start} - ${this.friday.end}` },
        { day: 'Sabato', hours: 'Chiuso' },
        { day: 'Domenica', hours: 'Chiuso' }
      ];
    }
  },
  
  // Social Media
  social: {
    facebook: 'https://facebook.com/kineticafisioterapia',
    instagram: 'https://instagram.com/kineticafisioterapia',
    linkedin: 'https://linkedin.com/company/kineticafisioterapia',
    youtube: 'https://youtube.com/@kineticafisioterapia',
  },
  
  // Servizi principali (riferimento veloce)
  mainServices: [
    'Fisioterapia',
    'Osteopatia',
    'Riabilitazione Sportiva',
    'Ginnastica Posturale',
    'Pilates',
    'Massaggio Terapeutico'
  ],
  
  // Informazioni legali
  legal: {
    partitaIva: 'IT12345678901',
    codiceFiscale: 'KNTFST25A01D969X',
    rea: 'GE-123456',
    responsabile: 'Dr.ssa Laura Bianchi',
  },
  
  // Configurazioni tecniche
  technical: {
    supportEmail: 'supporto@kineticafisioterapia.com',
    bookingEmail: 'prenotazioni@kineticafisioterapia.com',
    emergencyPhone: '+39 333 123 4567',
  },
  
  // SEO e metadata
  seo: {
    keywords: [
      'fisioterapia genova',
      'osteopatia',
      'riabilitazione',
      'pilates genova',
      'massaggio terapeutico',
      'ginnastica posturale'
    ],
    description: 'Centro di fisioterapia e riabilitazione a Genova. Fisioterapia, osteopatia, pilates e riabilitazione sportiva con professionisti qualificati.',
  }
} as const;

// Utility functions per formattazione
export const formatters = {
  // Formatta il telefono per display
  formatPhone: (phone: string) => {
    return phone.replace(/\+39\s?/, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  },
  
  // Formatta il telefono per link tel:
  formatPhoneLink: (phone: string) => {
    return phone.replace(/\s/g, '');
  },
  
  // Formatta l'email per link mailto:
  formatEmailLink: (email: string, subject?: string) => {
    return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
  },
  
  // Genera link Google Maps
  generateMapsLink: () => {
    return `https://maps.google.com/maps?q=${encodeURIComponent(STUDIO_INFO.address.googleMapsQuery)}`;
  },
  
  // Genera vCard per contatti
  generateVCard: () => {
    return `BEGIN:VCARD
VERSION:3.0
FN:${STUDIO_INFO.fullName}
ORG:${STUDIO_INFO.fullName}
TEL:${STUDIO_INFO.contact.phone}
EMAIL:${STUDIO_INFO.contact.email}
URL:${STUDIO_INFO.contact.website}
ADR:;;${STUDIO_INFO.address.street};${STUDIO_INFO.address.city};;${STUDIO_INFO.address.postalCode};${STUDIO_INFO.address.country}
END:VCARD`;
  }
};

export default STUDIO_INFO;
