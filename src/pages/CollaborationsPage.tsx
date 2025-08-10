import { Users, Heart, Award, CheckCircle, ArrowRight, Mail } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedText from '../components/AnimatedText';
import StaggeredList from '../components/StaggeredList';
import ParallaxElement from '../components/ParallaxElement';
import { useAdvancedAnimation } from '../hooks/useAnimations';

const CollaborationsPage = () => {
  const { ref: heroRef, animationClass: heroAnimation } = useAdvancedAnimation('fadeIn', 'up', 200);
  const { ref: partnershipsRef, animationClass: partnershipsAnimation } = useAdvancedAnimation('slideIn', 'left', 400);

  const partnerships = [
    {
      title: 'Palestre e Centri Fitness',
      description: 'Collaboriamo con le migliori strutture sportive di Genova per offrire programmi di riabilitazione e prevenzione integrati.',
      icon: '🏋️‍♂️',
      benefits: [
        'Programmi di prevenzione infortuni',
        'Screening posturali per atleti',
        'Corsi di educazione motoria',
        'Supporto per trainer e istruttori'
      ]
    },
    {
      title: 'Società Sportive',
      description: 'Partner ufficiale di squadre locali per la gestione sanitaria degli atleti e programmi di recupero funzionale.',
      icon: '⚽',
      benefits: [
        'Assistenza medica durante allenamenti',
        'Protocolli di recupero post-infortunio',
        'Valutazioni funzionali periodiche',
        'Programmi di preparazione atletica'
      ]
    },
    {
      title: 'Medici Specialisti',
      description: 'Rete di collaborazione con ortopedici, neurologi e medici dello sport per un approccio multidisciplinare.',
      icon: '👨‍⚕️',
      benefits: [
        'Consulenze specialistiche integrate',
        'Percorsi diagnostici condivisi',
        'Protocolli terapeutici personalizzati',
        'Follow-up multidisciplinare'
      ]
    },
    {
      title: 'Aziende e Enti',
      description: 'Servizi di medicina del lavoro e prevenzione per dipendenti aziendali con focus su ergonomia e benessere.',
      icon: '🏢',
      benefits: [
        'Valutazioni ergonomiche sul posto di lavoro',
        'Corsi di back school aziendale',
        'Screening posturali per dipendenti',
        'Consulenze su postazioni di lavoro'
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Sampdoria Calcio Femminile',
      logo: '⚽',
      text: 'La collaborazione con Kinetica ha migliorato significativamente la gestione degli infortuni e i tempi di recupero delle nostre atlete.',
      role: 'Staff Medico'
    },
    {
      name: 'Fitness Club Genova',
      logo: '🏋️‍♂️',
      text: 'I programmi di prevenzione sviluppati insieme hanno ridotto del 40% gli infortuni dei nostri iscritti.',
      role: 'Direttore Tecnico'
    },
    {
      name: 'Studio Medico Associato',
      logo: '👨‍⚕️',
      text: 'La sinergia professionale ci permette di offrire ai pazienti percorsi terapeutici completi e altamente specializzati.',
      role: 'Medico Ortopedico'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Floating background elements */}
      <ParallaxElement intensity={0.03} className="fixed inset-0 pointer-events-none z-0">
        <div className="animate-float absolute top-32 left-16 w-24 h-24 bg-primary-200 rounded-full opacity-20"></div>
        <div className="animate-float absolute top-20 right-32 w-20 h-20 bg-warm-300 rounded-full opacity-15" style={{animationDelay: '2s'}}></div>
      </ParallaxElement>

      {/* Header Section */}
      <section className="bg-white border-b border-gray-200 relative z-10">
        <div className="container-max section-padding">
          <div ref={heroRef} className={`text-center max-w-4xl mx-auto ${heroAnimation}`}>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Collaborazioni e <AnimatedText text="Partnership" className="text-primary-600" delay={500} speed={60} />
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed animate-fade-in-up animate-delay-300">
              Crediamo nella forza delle partnership professionali per offrire 
              il miglior servizio possibile ai nostri pazienti e alla comunità sportiva genovese.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="section-padding relative z-10">
        <div className="container-max">
          <div ref={partnershipsRef} className={`text-center mb-16 ${partnershipsAnimation}`}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Le Nostre Partnership
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up animate-delay-200">
              Collaboriamo con diverse realtà del territorio per creare una rete 
              integrata di servizi per la salute e il benessere.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {partnerships.map((partnership, index) => (
              <AnimatedCard key={index} delay={index * 150} direction={index % 2 === 0 ? 'left' : 'right'} className="card group cursor-pointer">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{partnership.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {partnership.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {partnership.description}
                    </p>
                    
                    <div className="space-y-3">
                      {partnership.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white section-padding relative z-10">
        <div className="container-max">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cosa Dicono i Nostri Partner
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La fiducia dei nostri partner è la testimonianza della qualità 
              dei nostri servizi e della nostra professionalità.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimatedCard key={index} delay={index * 200} className="card hover:rotate-1 transition-all duration-500">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-4">{testimonial.logo}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-primary-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic leading-relaxed">
                  "{testimonial.text}"
                </p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Perché Collaborare con Noi
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Award className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Esperienza Consolidata</h3>
                    <p className="text-gray-600">
                      Oltre 15 anni di esperienza nel settore con centinaia di 
                      collaborazioni di successo.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Users className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Team Multidisciplinare</h3>
                    <p className="text-gray-600">
                      Équipe di professionisti specializzati in diverse discipline 
                      per un approccio completo.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Heart className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Approccio Personalizzato</h3>
                    <p className="text-gray-600">
                      Ogni collaborazione è studiata su misura per soddisfare 
                      le specifiche esigenze del partner.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Servizi per Partner
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Consulenze Specialistiche</h4>
                  <p className="text-gray-600 text-sm">
                    Valutazioni e protocolli personalizzati per ogni realtà
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Formazione Continua</h4>
                  <p className="text-gray-600 text-sm">
                    Corsi e workshop per aggiornamento professionale
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Supporto Tecnico</h4>
                  <p className="text-gray-600 text-sm">
                    Assistenza continuativa e consulenza on-demand
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="bg-primary-600 text-white section-padding relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="animate-float absolute top-10 right-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="animate-float absolute bottom-20 left-20 w-24 h-24 bg-white rounded-full" style={{animationDelay: '1.5s'}}></div>
        </div>

        <div className="container-max text-center relative z-10">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Diventa Nostro Partner
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Sei interessato a sviluppare una collaborazione con noi? 
              Contattaci per discutere insieme le opportunità di partnership.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-bottom" style={{animationDelay: '0.5s'}}>
            <a
              href="/contatti"
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center group transform hover:scale-105"
            >
              <Mail className="w-5 h-5 mr-2 group-hover:animate-bounce-gentle" />
              Contattaci
            </a>
            
            <a
              href="mailto:partnership@kineticafisioterapia.it"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-4 px-8 rounded-lg transition-all duration-200 inline-flex items-center justify-center group transform hover:scale-105"
            >
              partnership@kinetica.it
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Partnership Process */}
      <section className="bg-white section-padding relative z-10">
        <div className="container-max">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Come Iniziare una Collaborazione
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un processo semplice e trasparente per sviluppare partnership di successo
            </p>
          </div>

          <StaggeredList className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">Primo Contatto</h3>
              <p className="text-gray-600">
                Contattaci per una consultazione iniziale gratuita per discutere 
                le tue esigenze e obiettivi.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">Analisi e Proposta</h3>
              <p className="text-gray-600">
                Studiamo insieme un piano di collaborazione personalizzato 
                con obiettivi chiari e misurabili.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">Avvio Partnership</h3>
              <p className="text-gray-600">
                Iniziamo la collaborazione con un periodo di prova per 
                ottimizzare insieme i processi e i risultati.
              </p>
            </div>
          </StaggeredList>
        </div>
      </section>
    </div>
  );
};

export default CollaborationsPage;
