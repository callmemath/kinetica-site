import { Mail, Phone, MapPin, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedText from '../components/AnimatedText';
import StaggeredList from '../components/StaggeredList';
import ParallaxElement from '../components/ParallaxElement';
import { useAdvancedAnimation } from '../hooks/useAnimations';
import { useStudioSettings } from '../hooks/useStudioSettings';

const ContactsPage = () => {
  const { ref: heroRef, animationClass: heroAnimation } = useAdvancedAnimation('fadeIn', 'up', 200);
  const { settings } = useStudioSettings();

  // Funzioni di formattazione
  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  const formatPhoneLink = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const formatEmailLink = (email: string) => {
    return `mailto:${email}`;
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Floating background elements */}
      <ParallaxElement intensity={0.04} className="fixed inset-0 pointer-events-none z-0">
        <div className="animate-float absolute top-20 left-20 w-28 h-28 bg-primary-200 rounded-full opacity-20"></div>
        <div className="animate-float absolute top-32 right-16 w-20 h-20 bg-warm-300 rounded-full opacity-15" style={{animationDelay: '2s'}}></div>
      </ParallaxElement>

      {/* Header Section */}
      <section className="bg-white border-b border-gray-200 relative z-10">
        <div className="container-max section-padding">
          <div ref={heroRef} className={`text-center ${heroAnimation}`}>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              <AnimatedText text="Contattaci" className="text-primary-600" delay={200} speed={60} />
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animate-delay-300">
              Siamo qui per aiutarti. Non esitare a contattarci per qualsiasi informazione 
              o per prenotare la tua visita.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Grid */}
      <section className="section-padding relative z-10">
        <div className="container-max">
          <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Telefono */}
            <AnimatedCard delay={0} className="card text-center group cursor-pointer">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-8 h-8 text-primary-600 group-hover:animate-bounce-gentle" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Telefono</h3>
              <p className="text-gray-600 mb-4">
                Chiamaci durante gli orari di apertura
              </p>
              <a 
                href={`tel:${formatPhoneLink(settings.phone)}`} 
                className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                {formatPhone(settings.phone)}
              </a>
            </AnimatedCard>

            {/* Email */}
            <AnimatedCard delay={150} className="card text-center group cursor-pointer">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-8 h-8 text-primary-600 group-hover:animate-bounce-gentle" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Email</h3>
              <p className="text-gray-600 mb-4">
                Scrivici per informazioni dettagliate
              </p>
              <a 
                href={formatEmailLink(settings.email)} 
                className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                {settings.email}
              </a>
            </AnimatedCard>

            {/* Indirizzo */}
            <AnimatedCard delay={300} className="card text-center group cursor-pointer">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8 text-primary-600 group-hover:animate-bounce-gentle" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Indirizzo</h3>
              <p className="text-gray-600 mb-4">
                Vieni a trovarci nel nostro studio
              </p>
              <address className="text-primary-600 font-medium not-italic">
                {settings.address}<br />
                {settings.city}
              </address>
            </AnimatedCard>
          </StaggeredList>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <AnimatedCard delay={400} direction="left" className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Invia un Messaggio
              </h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Il tuo nome"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Il tuo cognome"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="la-tua-email@esempio.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Oggetto
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleziona un argomento</option>
                    <option value="booking">Prenotazione Appuntamento</option>
                    <option value="info">Richiesta Informazioni</option>
                    <option value="treatments">Domande sui Trattamenti</option>
                    <option value="insurance">Convenzioni Assicurative</option>
                    <option value="other">Altro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Messaggio *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Scrivi qui il tuo messaggio..."
                  ></textarea>
                </div>

                <div className="flex items-center">
                  <input
                    id="privacy"
                    name="privacy"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
                    Accetto il trattamento dei dati personali secondo la{' '}
                    <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-700">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full group"
                >
                  <Mail className="w-5 h-5 mr-2 group-hover:animate-bounce-gentle" />
                  Invia Messaggio
                </button>
              </form>
            </AnimatedCard>

            {/* Info and Hours */}
            <div className="space-y-8">
              {/* Hours */}
              <AnimatedCard delay={600} direction="right" className="card">
                <div className="flex items-center mb-6">
                  <Clock className="w-6 h-6 text-primary-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Orari di Apertura</h2>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(settings.openingHours).map(([day, hours]) => {
                    const dayLabels: Record<string, string> = {
                      monday: 'Lunedì',
                      tuesday: 'Martedì', 
                      wednesday: 'Mercoledì',
                      thursday: 'Giovedì',
                      friday: 'Venerdì',
                      saturday: 'Sabato',
                      sunday: 'Domenica'
                    };
                    
                    return (
                      <div key={day} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">{dayLabels[day]}</span>
                        <span className={`font-medium ${hours.closed ? 'text-red-600' : 'text-gray-900'}`}>
                          {hours.closed ? 'Chiuso' : `${hours.open} - ${hours.close}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </AnimatedCard>

              {/* Emergency */}
              <AnimatedCard delay={750} className="card bg-red-50 border-red-200 group">
                <h3 className="text-lg font-semibold text-red-800 mb-3 group-hover:scale-105 transition-transform">
                  Emergenze
                </h3>
                <p className="text-red-700 mb-4">
                  Per urgenze fuori dagli orari di apertura, contatta il nostro numero principale:
                </p>
                <a 
                  href={`tel:${formatPhoneLink(settings.phone)}`} 
                  className="text-red-600 font-medium hover:text-red-700 transition-colors"
                >
                  {formatPhone(settings.phone)}
                </a>
              </AnimatedCard>

              {/* Quick Booking */}
              <AnimatedCard delay={900} className="card bg-primary-50 border-primary-200 group">
                <h3 className="text-lg font-semibold text-primary-800 mb-3 group-hover:scale-105 transition-transform">
                  Prenotazione Rapida
                </h3>
                <p className="text-primary-700 mb-4">
                  Preferisci prenotare online? Usa il nostro sistema di prenotazione.
                </p>
                <a 
                  href="/prenota" 
                  className="btn-primary inline-flex items-center group"
                >
                  <Calendar className="w-4 h-4 mr-2 group-hover:animate-bounce-gentle" />
                  Prenota Ora
                </a>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-white section-padding">
        <div className="container-max">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Come Raggiungerci
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Placeholder for Google Maps */}
              <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Mappa interattiva<br />
                    {settings.address}, {settings.city}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">🚗 In Auto</h3>
                <p className="text-gray-600 text-sm">
                  Zona con parcheggi nelle vicinanze in {settings.address}. 
                  Facilmente raggiungibile dal centro di {settings.city}.
                </p>
              </div>
              
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">🚌 Mezzi Pubblici</h3>
                <p className="text-gray-600 text-sm">
                  Facilmente raggiungibile con i mezzi pubblici.
                  Diverse linee di autobus servono la zona di {settings.address}.
                </p>
              </div>
              
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">🚶‍♂️ A Piedi</h3>
                <p className="text-gray-600 text-sm">
                  Nel centro di {settings.city}.
                  Studio facilmente accessibile e ben collegato.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactsPage;
