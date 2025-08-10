import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Award, MapPin, Phone, ArrowRight, Star, CheckCircle } from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import AnimatedText from '../components/AnimatedText';
import AnimatedCard from '../components/AnimatedCard';
import { apiService } from '../services/api';
import { type Service, type Category } from '../types';

const HomePage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carica i servizi dal database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await apiService.getServices();
        if (response.success && response.data) {
          // Limitiamo a 5 servizi per la homepage
          setServices(response.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        // Fallback ai servizi mock in caso di errore
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Mapping per icone basato sul nome/categoria, colori dinamici dal database
  const getServiceStyle = (serviceName: string, category?: Category) => {
    const name = serviceName.toLowerCase();
    const catValue = category?.value?.toLowerCase() || '';
    
    // Icone basate sulla categoria/nome
    let icon = '⚕️';
    if (name.includes('fisioterapia') || catValue.includes('fisioterapia')) {
      icon = '🦴';
    } else if (name.includes('osteopatia') || catValue.includes('osteopatia')) {
      icon = '🙌';
    } else if (name.includes('sportiva') || catValue.includes('riabilitazione')) {
      icon = '⚽';
    } else if (name.includes('posturale') || catValue.includes('ginnastica')) {
      icon = '🧘‍♀️';
    } else if (name.includes('pilates') || catValue.includes('pilates')) {
      icon = '🤸';
    } else if (name.includes('massaggio') || catValue.includes('massaggio')) {
      icon = '💆';
    }
    
    // Colore dinamico dalla categoria, con fallback
    let colorClass = 'bg-gray-50 text-gray-600';
    if (category?.color) {
      const isLightColor = isColorLight(category.color);
      const backgroundColor = category.color + '20'; // Add transparency
      const textColor = isLightColor ? '#374151' : category.color;
      return { 
        icon, 
        style: { backgroundColor, color: textColor }
      };
    }
    
    return { icon, color: colorClass };
  };

  // Funzione helper per determinare se un colore è chiaro o scuro
  const isColorLight = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };

  const stats = [
    { number: 2000, label: 'Pazienti Trattati', suffix: '+' },
    { number: 9, label: 'Anni di Esperienza', suffix: '+' },
    { number: 5, label: 'Specializzazioni' },
    { number: 98, label: 'Soddisfazione Clienti', suffix: '%' }
  ];

  const testimonials = [
    {
      name: 'Marco R.',
      text: 'Professionalità e competenza eccezionali. Dopo il mio infortunio sportivo sono tornato più forte di prima.',
      rating: 5
    },
    {
      name: 'Elena S.',
      text: 'Kinetica mi ha aiutato a risolvere anni di mal di schiena. Trattamenti efficaci e staff preparatissimo.',
      rating: 5
    },
    {
      name: 'Davide L.',
      text: 'Centro d\'eccellenza nel cuore di Genova. Mi sono sempre trovato benissimo, lo consiglio a tutti.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg relative overflow-hidden">
        {/* Background animated elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="animate-float absolute top-20 left-10 w-20 h-20 bg-primary-300 rounded-full"></div>
          <div className="animate-float absolute top-40 right-20 w-16 h-16 bg-primary-400 rounded-full" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="container-max hero-section-padding relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="animate-fade-in-up">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Il tuo{' '}
                  <AnimatedText 
                    text="benessere" 
                    className="text-primary-600"
                    delay={500}
                    speed={60}
                  />{' '}
                  è la nostra missione
                </h1>
                <p className="text-xl text-gray-600 mt-6 leading-relaxed animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                  Studio specializzato in fisioterapia, osteopatia e riabilitazione sportiva. 
                  Esperienza professionale e tecnologie innovative per il tuo recupero.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                <Link to="/prenota" className="btn-primary text-center group">
                  <Calendar className="w-5 h-5 mr-2 group-hover:animate-bounce-gentle" />
                  Prenota la tua visita
                </Link>
                <Link to="/servizi" className="btn-secondary text-center group">
                  Scopri i servizi
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex items-center space-x-6 pt-8 animate-fade-in-up" style={{animationDelay: '0.9s'}}>
                <div className="flex items-center space-x-2 group cursor-pointer">
                  <MapPin className="w-5 h-5 text-primary-600 group-hover:animate-bounce-gentle" />
                  <span className="text-gray-700 group-hover:text-primary-600 transition-colors">Genova Centro</span>
                </div>
                <div className="flex items-center space-x-2 group">
                  <Phone className="w-5 h-5 text-primary-600 group-hover:animate-bounce-gentle" />
                  <a href="tel:+390102465820" className="text-gray-700 hover:text-primary-600 transition-colors">
                    010 246 5820
                  </a>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in-right">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:rotate-1 transition-all duration-500 hover:scale-105 animate-float">
                <img
                  src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="Studio Kinetica - Fisioterapia"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900">Studio Moderno</h3>
                  <p className="text-gray-600 mt-2">Attrezzature all'avanguardia per trattamenti efficaci</p>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold animate-bounce-gentle">
                ✨ Nuovo!
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white shadow-lg px-4 py-2 rounded-full text-sm font-semibold animate-pulse-glow">
                🏆 Certificato
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className=" py-10 relative overflow-hidden">
        <div className="container-max relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <AnimatedCounter
                key={index}
                end={stat.number}
                label={stat.label}
                suffix={stat.suffix || ''}
                duration={2000 + (index * 200)}
                className="hover:scale-110 transition-transform duration-300"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-50 section-padding relative">
        <div className="container-max">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              I Nostri Servizi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Offriamo una gamma completa di trattamenti personalizzati per ogni esigenza
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))
            ) : (
              services.map((service, index) => {
                const style = getServiceStyle(service.name, service.category);
                return (
                  <AnimatedCard 
                    key={service.id} 
                    delay={index * 150}
                    direction={index % 2 === 0 ? 'left' : 'right'}
                    className="group cursor-pointer"
                  >
                    <div 
                      className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 ${style.color || ''}`}
                      style={style.style || undefined}
                    >
                      {style.icon}
                    </div>
                    {service.imageUrl && (
                      <div className="mb-4">
                        <img 
                          src={service.imageUrl} 
                          alt={service.name}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{service.duration} min</span>
                      <span>€{service.price}</span>
                    </div>
                    <Link 
                      to="/servizi" 
                      className="text-primary-600 font-medium hover:text-primary-700 flex items-center group-hover:translate-x-2 transition-transform"
                    >
                      Scopri di più
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:animate-bounce-gentle" />
                    </Link>
                  </AnimatedCard>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-white section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Perché Scegliere Kinetica?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Esperienza Professionale</h3>
                    <p className="text-gray-600">
                      Team di specialisti con oltre 10 anni di esperienza nel settore
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Approccio Personalizzato</h3>
                    <p className="text-gray-600">
                      Ogni trattamento è studiato specificamente per le tue esigenze
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tecnologie Avanzate</h3>
                    <p className="text-gray-600">
                      Attrezzature moderne per trattamenti efficaci e sicuri
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Collaborazioni Prestigiose</h3>
                    <p className="text-gray-600">
                      Lavoriamo con realtà importanti come Cirque Du Soleil e Genova Volley
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                alt="Team Kinetica"
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <Award className="w-8 h-8 text-primary-600" />
                  <div>
                    <div className="font-bold text-gray-900">Certificati</div>
                    <div className="text-sm text-gray-600">Specialisti Qualificati</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 section-padding">
        <div className="container-max">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Cosa Dicono i Nostri Pazienti
            </h2>
            <p className="text-xl text-gray-600">
              La soddisfazione dei nostri pazienti è la nostra priorità
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimatedCard 
                key={index} 
                delay={index * 200}
                className="hover:rotate-1 transition-all duration-500"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-5 h-5 text-yellow-400 fill-current animate-pulse" 
                      style={{animationDelay: `${i * 0.1}s`}}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="font-semibold text-gray-900">
                  {testimonial.name}
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white section-padding relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="animate-float absolute top-10 right-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="animate-float absolute bottom-20 left-20 w-24 h-24 bg-white rounded-full" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        <div className="container-max text-center relative z-10">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Inizia il Tuo Percorso di Benessere
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Prenota una consulenza gratuita e scopri come possiamo aiutarti a raggiungere i tuoi obiettivi di salute
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-bottom" style={{animationDelay: '0.5s'}}>
            <Link 
              to="/prenota" 
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-4 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 group"
            >
              <Calendar className="w-5 h-5 mr-2 inline group-hover:animate-bounce-gentle" />
              Prenota Ora
            </Link>
            <Link 
              to="/contatti" 
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
            >
              <Phone className="w-5 h-5 mr-2 inline group-hover:animate-bounce-gentle" />
              Chiamaci
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
