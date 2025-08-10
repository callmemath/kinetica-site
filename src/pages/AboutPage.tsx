import { Users, Award, Heart, Target, CheckCircle, Star, Calendar, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedCounter from '../components/AnimatedCounter';
import StaggeredList from '../components/StaggeredList';
import ParallaxElement from '../components/ParallaxElement';
import { useAdvancedAnimation } from '../hooks/useAnimations';
import { apiService } from '../services/api';

// Tipo unificato per i membri del team
interface TeamMember {
  id?: string;
  name: string;
  role: string;
  specialization: string;
  experience?: string;
  description: string;
  image: string;
}

const AboutPage = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  const { ref: heroRef, animationClass: heroAnimation } = useAdvancedAnimation('fadeIn', 'up', 200);
  const { ref: philosophyRef, animationClass: philosophyAnimation } = useAdvancedAnimation('slideIn', 'left', 400);

  // Fallback team data in caso non ci siano dati dal database
  const fallbackTeam: TeamMember[] = [
    {
      name: 'Dr.ssa Chiara Fontana',
      role: 'Fondatrice e Direttore Sanitario',
      specialization: 'Fisioterapia Ortopedica e Neurologica',
      experience: '18 anni',
      description: 'Laureata in Fisioterapia presso l\'Università di Genova, specializzata in terapia manuale ortopedica e riabilitazione neurologica. Ha fondato Kinetica nel 2015 con l\'obiettivo di creare un centro d\'eccellenza per la riabilitazione.',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      name: 'Dr. Alessandro Moretti',
      role: 'Fisioterapista e Osteopata',
      specialization: 'Osteopatia e Riabilitazione Sportiva',
      experience: '14 anni',
      description: 'Osteopata D.O. e fisioterapista specializzato nella cura degli atleti. Collabora con società sportive genovesi e atleti professionisti per la prevenzione e il recupero da infortuni.',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      name: 'Dr.ssa Elena Bianchi',
      role: 'Fisioterapista e Istruttrice Pilates',
      specialization: 'Pilates Clinico e Rieducazione Posturale',
      experience: '10 anni',
      description: 'Specializzata in Pilates clinico e rieducazione posturale globale (RPG). Si dedica al trattamento delle disfunzioni posturali e alla prevenzione attraverso il movimento consapevole.',
      image: 'https://images.unsplash.com/photo-1594824947933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    }
  ];

  // Funzione per trasformare i dati del database nel formato originale
  const transformDatabaseToTeamMember = (dbMember: any): TeamMember => {
    // Assegna ruoli e descrizioni più dettagliate basate sulla specializzazione
    const memberInfo = getMemberDetails(dbMember.specialization, dbMember.firstName);
    
    // Usa gli anni di esperienza dal database se disponibili, altrimenti usa il fallback
    const experience = dbMember.yearsOfExperience 
      ? `${dbMember.yearsOfExperience} anni`
      : memberInfo.experience;
    
    // Usa la bio dal database se disponibile, altrimenti usa la descrizione di fallback
    const description = dbMember.bio && dbMember.bio.trim() !== '' 
      ? dbMember.bio 
      : memberInfo.description;
    
    // Usa avatar dal database se disponibile, altrimenti immagine di fallback
    const image = dbMember.avatar || memberInfo.image;
    
    return {
      id: dbMember.id,
      name: `${memberInfo.title} ${dbMember.firstName} ${dbMember.lastName}`,
      role: memberInfo.role,
      specialization: dbMember.specialization,
      experience: experience,
      description: description,
      image: image
    };
  };

  // Funzione per ottenere dettagli specifici basati sulla specializzazione
  const getMemberDetails = (specialization: string, firstName: string) => {
    const spec = specialization.toLowerCase();
    
    if (spec.includes('fisioterapista') && spec.includes('osteopata')) {
      return {
        title: 'Dr.',
        role: 'Fisioterapista e Osteopata',
        experience: '14 anni',
        description: 'Osteopata D.O. e fisioterapista specializzato nella cura degli atleti. Collabora con società sportive genovesi e atleti professionisti per la prevenzione e il recupero da infortuni.',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
      };
    }
    
    if (spec.includes('fisioterapista') && spec.includes('sportivo')) {
      return {
        title: 'Dr.',
        role: 'Fisioterapista Sportivo',
        experience: '12 anni',
        description: 'Specializzato nella riabilitazione e prevenzione degli infortuni sportivi. Lavora con atleti professionisti e amatori per ottimizzare le performance e accelerare il recupero.',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
      };
    }
    
    if (spec.includes('pilates') || spec.includes('posturale')) {
      return {
        title: 'Dr.ssa',
        role: 'Fisioterapista e Istruttrice Pilates',
        experience: '10 anni',
        description: 'Specializzata in Pilates clinico e rieducazione posturale globale (RPG). Si dedica al trattamento delle disfunzioni posturali e alla prevenzione attraverso il movimento consapevole.',
        image: 'https://images.unsplash.com/photo-1594824947933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
      };
    }
    
    if (spec.includes('massoterapista') || spec.includes('massaggio')) {
      return {
        title: 'Dr.',
        role: 'Massoterapista e Fisioterapista',
        experience: '8 anni',
        description: 'Esperto in tecniche di massoterapia e trattamenti manuali. Specializzato nel trattamento del dolore muscolare e nel rilassamento profondo dei tessuti.',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
      };
    }
    
    // Default per altre specializzazioni
    return {
      title: firstName.toLowerCase().endsWith('a') ? 'Dr.ssa' : 'Dr.',
      role: 'Fisioterapista Specializzato',
      experience: '8+ anni',
      description: 'Professionista qualificato con esperienza nel trattamento riabilitativo e nella cura del benessere fisico dei pazienti.',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    };
  };

  // Carica i dati dello staff dal database
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await apiService.getStaff();
        if (response.success && response.data) {
          const activeStaff = response.data.filter(member => member.isActive);
          
          // Trasforma i dati del database nel formato originale con dettagli completi
          const transformedMembers: TeamMember[] = activeStaff.map(member => 
            transformDatabaseToTeamMember(member)
          );
          
          setTeamMembers(transformedMembers);
        } else {
          // Usa i dati di fallback se non ci sono dati dal database
          setTeamMembers(fallbackTeam);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        // In caso di errore, usa i dati di fallback
        setTeamMembers(fallbackTeam);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaff();
  }, []);


  const values = [
    {
      icon: Heart,
      title: 'Cura Personalizzata',
      description: 'Ogni paziente è unico. Creiamo percorsi terapeutici personalizzati basati sulle specifiche esigenze e obiettivi individuali.'
    },
    {
      icon: Target,
      title: 'Approccio Olistico',
      description: 'Non ci limitiamo a trattare il sintomo, ma indaghiamo le cause profonde per garantire risultati duraturi e benessere completo.'
    },
    {
      icon: Award,
      title: 'Eccellenza Professionale',
      description: 'Formazione continua e aggiornamento costante per offrire sempre le migliori tecniche terapeutiche disponibili.'
    },
    {
      icon: Users,
      title: 'Team Specializzato',
      description: 'Un gruppo di professionisti esperti che collaborano per offrirti la migliore esperienza terapeutica possibile.'
    }
  ];

  const achievements = [
    'Oltre 1500 pazienti trattati con successo',
    'Collaborazioni con realtà prestigiose come Cirque Du Soleil',
    'Partnership con Genova Volley per la riabilitazione atleti',
    'Certificazioni internazionali in tecniche avanzate',
    'Studio dotato di attrezzature all\'avanguardia',
    '98% di soddisfazione dei pazienti'
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Floating background elements */}
      <ParallaxElement intensity={0.05} className="fixed inset-0 pointer-events-none z-0">
        <div className="animate-float absolute top-20 left-10 w-32 h-32 bg-primary-200 rounded-full opacity-20"></div>
        <div className="animate-float absolute top-40 right-20 w-24 h-24 bg-warm-300 rounded-full opacity-15" style={{animationDelay: '2s'}}></div>
      </ParallaxElement>

      {/* Hero Section */}
      <section className="gradient-bg section-padding relative z-10">
        <div className="container-max">
          <div ref={heroRef} className={`text-center max-w-4xl mx-auto ${heroAnimation}`}>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              Chi <span className="text-primary-600">Siamo</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed animate-fade-in-up animate-delay-300">
              Siamo un team di professionisti appassionati, dedicati al tuo benessere. 
              La nostra missione è aiutarti a raggiungere i tuoi obiettivi di salute 
              attraverso trattamenti personalizzati e tecnologie innovative.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-white section-padding relative z-10">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div ref={philosophyRef} className={philosophyAnimation}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 animate-fade-in-left">
                La Nostra Filosofia
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed animate-fade-in-left animate-delay-200">
                Kinetica Fisioterapia nasce nel 2015 dall'esperienza e dalla passione della 
                Dr.ssa Chiara Fontana, con l'obiettivo di creare un centro d'eccellenza per 
                la riabilitazione nel cuore di Genova. La nostra filosofia si basa sull'approccio 
                olistico alla persona, dove ogni trattamento è studiato per le specifiche esigenze del paziente.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed animate-fade-in-left animate-delay-400">
                Collaboriamo con medici specialisti, società sportive e centri fitness per 
                offrire un servizio completo e integrato. La nostra sede di Via del Campo 
                è dotata delle più moderne attrezzature per fisioterapia, osteopatia e 
                riabilitazione sportiva, garantendo trattamenti all'avanguardia in un 
                ambiente accogliente e professionale.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-left animate-delay-600">
                <AnimatedCounter
                  end={2015}
                  label="Anno di Fondazione"
                  animationType="bounce"
                  className="hover-scale"
                />
                <AnimatedCounter
                  end={2000}
                  label="Pazienti Trattati"
                  suffix="+"
                  animationType="scale"
                  className="hover-scale"
                />
              </div>
            </div>
            
            <ParallaxElement intensity={0.15} className="relative">
              <AnimatedCard 
                delay={800} 
                animationType="scaleIn" 
                hoverEffect="glow"
                enableParallax={true}
                className="overflow-hidden"
              >
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Studio Kinetica - Filosofia"
                  className="w-full h-96 object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg animate-bounce-in animate-delay-1000">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-8 h-8 text-primary-600 animate-heartbeat" />
                    <div>
                      <div className="font-bold text-gray-900">Cura</div>
                      <div className="text-sm text-gray-600">Personalizzata</div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </ParallaxElement>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 section-padding relative z-10">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              I Nostri Valori
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up animate-delay-200">
              Questi principi guidano ogni nostra azione e definiscono il modo in cui ci prendiamo cura di te
            </p>
          </div>

          <StaggeredList 
            staggerDelay={200} 
            baseDelay={400}
            animationType="bounceIn"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <AnimatedCard 
                key={index} 
                hoverEffect="scale" 
                enableParallax={true}
                parallaxIntensity={0.08}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors group-hover:animate-bounce">
                  <value.icon className="w-8 h-8 text-primary-600 group-hover:animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </AnimatedCard>
            ))}
          </StaggeredList>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white section-padding relative z-10">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Il Nostro Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up animate-delay-200">
              Professionisti qualificati e appassionati, sempre aggiornati sulle ultime tecniche terapeutiche
            </p>
          </div>

          <StaggeredList 
            staggerDelay={250} 
            baseDelay={600}
            animationType="scaleIn"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              isLoadingStaff ? (
                // Loading skeleton per il team
                [...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-6"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : teamMembers.length > 0 ? (
                teamMembers.map((member, index) => (
                  <AnimatedCard 
                    key={member.id || index} 
                    hoverEffect="lift" 
                    enableParallax={true}
                    parallaxIntensity={0.12}
                    className="text-center group"
                  >
                    <div className="relative mb-6">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-32 h-32 rounded-full object-cover mx-auto shadow-lg group-hover:shadow-2xl transition-shadow duration-300"
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center group-hover:animate-bounce">
                        <Star className="w-4 h-4 text-white fill-current animate-pulse" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-primary-600 font-medium mb-2">
                      {member.specialization}
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                      {member.experience} di esperienza
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {member.description}
                    </p>
                  </AnimatedCard>
                ))
              ) : (
                // Messaggio quando non ci sono membri del team
                <div className="col-span-full text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Team in aggiornamento
                  </h3>
                  <p className="text-gray-600">
                    Le informazioni sul nostro team saranno presto disponibili
                  </p>
                </div>
              )
            ].flat()}
          </StaggeredList>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="bg-primary-600 text-white section-padding relative z-10 overflow-hidden">
        {/* Animated background elements */}
        <ParallaxElement intensity={-0.05} className="absolute inset-0 opacity-10">
          <div className="animate-float absolute top-10 right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="animate-float-reverse absolute bottom-20 left-20 w-32 h-32 bg-white rounded-full" style={{animationDelay: '1.5s'}}></div>
        </ParallaxElement>

        <div className="container-max relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 animate-fade-in-up">
              I Nostri Riconoscimenti
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto animate-fade-in-up animate-delay-200">
              Risultati che parlano della nostra dedizione e professionalità
            </p>
          </div>

          <StaggeredList 
            staggerDelay={150} 
            baseDelay={400}
            animationType="slideIn"
            direction="left"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white/10 rounded-lg p-4 hover-lift group cursor-pointer">
                <CheckCircle className="w-6 h-6 text-warm-200 flex-shrink-0 group-hover:animate-bounce" />
                <span className="text-white group-hover:text-warm-100 transition-colors">{achievement}</span>
              </div>
            ))}
          </StaggeredList>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white section-padding relative z-10">
        <div className="container-max text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
            Inizia il Tuo Percorso con Noi
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in-up animate-delay-200">
            Contattaci per una consulenza gratuita e scopri come possiamo aiutarti 
            a raggiungere i tuoi obiettivi di benessere
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up animate-delay-400">
            <Link to="/prenota" className="btn-primary hover-lift group">
              <Calendar className="w-5 h-5 group-hover:animate-bounce-gentle" />
              <span className="ml-2">Prenota una Consulenza</span>
            </Link>
            <Link to="/contatti" className="btn-secondary hover-scale group">
              <Phone className="w-5 h-5 group-hover:animate-pulse" />
              <span className="ml-2">Contattaci</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
