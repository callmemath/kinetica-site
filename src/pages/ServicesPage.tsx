import { useEffect, useState } from 'react';
import { Clock, Euro, ArrowRight, CheckCircle, Target } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedText from '../components/AnimatedText';
import { apiService } from '../services/api';
import { type Service } from '../types';
import { Link } from 'react-router-dom';

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carica i servizi dal database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await apiService.getServices();
        if (response.success && response.data) {
          setServices(response.data);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Mapping per ottenere dettagli aggiuntivi basati sul nome del servizio
  const getServiceDetails = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    
    if (name.includes('fisioterapia')) {
      return {
        subtitle: 'Recupero funzionale personalizzato',
        color: 'bg-blue-50 border-blue-200',
        iconColor: 'bg-blue-100 text-blue-600',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        benefits: [
          'Riduzione del dolore e dell\'infiammazione',
          'Miglioramento della mobilità articolare',
          'Recupero della forza muscolare',
          'Prevenzione di recidive'
        ]
      };
    }
    
    if (name.includes('osteopatia')) {
      return {
        subtitle: 'Approccio olistico al benessere',
        color: 'bg-green-50 border-green-200',
        iconColor: 'bg-green-100 text-green-600',
        image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        benefits: [
          'Miglioramento della postura',
          'Riduzione delle tensioni muscolari',
          'Ottimizzazione della circolazione',
          'Equilibrio del sistema nervoso'
        ]
      };
    }
    
    if (name.includes('riabilitazione') || name.includes('sportiva')) {
      return {
        subtitle: 'Recupero post-infortunio per atleti',
        color: 'bg-orange-50 border-orange-200',
        iconColor: 'bg-orange-100 text-orange-600',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        benefits: [
          'Recupero completo delle performance',
          'Prevenzione degli infortuni',
          'Condizionamento specifico per sport',
          'Ritorno sicuro all\'attività'
        ]
      };
    }

    if (name.includes('pilates')) {
      return {
        subtitle: 'Rafforzamento e flessibilità',
        color: 'bg-pink-50 border-pink-200',
        iconColor: 'bg-pink-100 text-pink-600',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        benefits: [
          'Rafforzamento del core',
          'Miglioramento della flessibilità',
          'Correzione posturale',
          'Rilassamento e benessere'
        ]
      };
    }

    if (name.includes('posturale')) {
      return {
        subtitle: 'Correzione e prevenzione posturale',
        color: 'bg-purple-50 border-purple-200',
        iconColor: 'bg-purple-100 text-purple-600',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        benefits: [
          'Correzione dei disallineamenti',
          'Rafforzamento muscolare mirato',
          'Educazione posturale',
          'Prevenzione dei dolori'
        ]
      };
    }

    if (name.includes('massaggio')) {
      return {
        subtitle: 'Benessere e recupero muscolare',
        color: 'bg-indigo-50 border-indigo-200',
        iconColor: 'bg-indigo-100 text-indigo-600',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        benefits: [
          'Rilassamento muscolare profondo',
          'Miglioramento della circolazione',
          'Riduzione dello stress',
          'Recupero post-allenamento'
        ]
      };
    }

    // Default
    return {
      subtitle: 'Trattamento specializzato',
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'bg-gray-100 text-gray-600',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      benefits: ['Trattamento personalizzato', 'Approccio professionale', 'Risultati efficaci']
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container-max px-4">
          <div className="text-center">
            <AnimatedText 
              text="I Nostri Servizi"
              className="text-4xl md:text-5xl font-bold mb-6"
              delay={100}
            />
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Offriamo una gamma completa di trattamenti specializzati per il tuo benessere
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container-max px-4">
          <div className="space-y-16">
            {isLoading ? (
              // Loading skeleton
              [...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
              ))
            ) : services.length > 0 ? (
              services.map((service, index) => {
                const details = getServiceDetails(service.name);
                return (
                  <AnimatedCard 
                    key={service.id} 
                    delay={index * 200}
                    direction={index % 2 === 0 ? 'left' : 'right'}
                    className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center group ${
                      index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                    }`}
                  >
                    {/* Content */}
                    <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                      <div className={`p-8 rounded-2xl border-2 ${details.color} group-hover:scale-105 transition-transform duration-500`}>
                        <div className={`w-16 h-16 rounded-lg ${details.iconColor} flex items-center justify-center mb-6`}>
                          <Target className="w-8 h-8" />
                        </div>
                        
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {service.name}
                        </h2>
                        
                        <p className="text-primary-600 font-semibold mb-4">
                          {details.subtitle}
                        </p>
                        
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          {service.description}
                        </p>
                        
                        <div className="flex items-center gap-6 mb-6">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-5 h-5 text-primary-600" />
                            <span>{service.duration} minuti</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Euro className="w-5 h-5 text-primary-600" />
                            <span>€{service.price}</span>
                          </div>
                        </div>
                        
                        {/* Benefits */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Benefici:</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {details.benefits.map((benefit, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600 text-sm">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* CTA */}
                        <Link 
                          to="/prenota" 
                          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors group-hover:scale-105 transition-transform duration-300"
                        >
                          Prenota ora
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                    
                    {/* Image */}
                    <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                      <div className="relative overflow-hidden rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        <img 
                          src={service.imageUrl || details.image} 
                          alt={service.name}
                          className="w-full h-80 object-cover"
                          onError={(e) => {
                            // Se imageUrl fallisce, prova con l'immagine di fallback
                            if (service.imageUrl && e.currentTarget.src === service.imageUrl) {
                              e.currentTarget.src = details.image;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    </div>
                  </AnimatedCard>
                );
              })
            ) : (
              // No services message
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessun servizio disponibile
                </h3>
                <p className="text-gray-600">
                  I nostri servizi saranno presto disponibili
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container-max px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto a iniziare il tuo percorso di benessere?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Contattaci per una consulenza personalizzata o prenota direttamente online
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/prenota" 
              className="btn-secondary bg-white text-primary-600 hover:bg-gray-100"
            >
              Prenota ora
            </Link>
            <Link 
              to="/contatti" 
              className="btn-outline border-white text-white hover:bg-white hover:text-primary-600"
            >
              Contattaci
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;