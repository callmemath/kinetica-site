import { Cookie, Shield, Eye, Settings, FileText, Calendar } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-max px-4">
        <AnimatedCard delay={100}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-12">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white/10 rounded-full">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  Informativa sulla Privacy
                </h1>
                <p className="text-primary-100 text-lg">
                  La tua privacy è importante per noi. Scopri come proteggiamo i tuoi dati.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-12">
              {/* Last updated */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
                <Calendar className="w-4 h-4" />
                <span>Ultimo aggiornamento: 8 agosto 2025</span>
              </div>

              <div className="prose prose-lg max-w-none">
                {/* Introduzione */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-primary-600" />
                    Introduzione
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Kinetica Fisioterapia Genova si impegna a proteggere la privacy e i dati personali 
                    dei propri utenti. Questa informativa descrive come raccogliamo, utilizziamo e 
                    proteggiamo le tue informazioni quando utilizzi il nostro sito web e i nostri servizi.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Siamo conformi al Regolamento Generale sulla Protezione dei Dati (GDPR) e alla 
                    normativa italiana sulla privacy.
                  </p>
                </section>

                {/* Dati raccolti */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Dati che Raccogliamo
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Dati Forniti Direttamente
                      </h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Nome e cognome</li>
                        <li>Indirizzo email</li>
                        <li>Numero di telefono</li>
                        <li>Data di nascita</li>
                        <li>Indirizzo di residenza</li>
                        <li>Informazioni mediche rilevanti (solo se fornite volontariamente)</li>
                        <li>Preferenze di appuntamento</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Dati Raccolti Automaticamente
                      </h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Indirizzo IP</li>
                        <li>Tipo di browser e dispositivo</li>
                        <li>Pagine visitate e tempo di permanenza</li>
                        <li>Referrer (sito da cui provieni)</li>
                        <li>Data e ora delle visite</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Come utilizziamo i dati */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Come Utilizziamo i Tuoi Dati
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Finalità Principali
                      </h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Gestione degli appuntamenti</li>
                        <li>Comunicazioni relative ai servizi</li>
                        <li>Fatturazione e pagamenti</li>
                        <li>Assistenza clienti</li>
                        <li>Miglioramento dei servizi</li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Finalità Secondarie
                      </h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Analisi statistiche anonime</li>
                        <li>Marketing (solo con consenso)</li>
                        <li>Personalizzazione dell'esperienza</li>
                        <li>Sicurezza del sito web</li>
                        <li>Adempimenti legali</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Cookie */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Cookie className="w-6 h-6 mr-2 text-primary-600" />
                    Utilizzo dei Cookie
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Il nostro sito utilizza cookie per migliorare la tua esperienza di navigazione. 
                    Puoi gestire le tue preferenze sui cookie attraverso il banner che appare 
                    al primo accesso al sito.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        icon: Shield,
                        title: 'Cookie Necessari',
                        description: 'Essenziali per il funzionamento del sito',
                        color: 'green'
                      },
                      {
                        icon: Eye,
                        title: 'Cookie Analitici',
                        description: 'Per analizzare l\'utilizzo del sito',
                        color: 'blue'
                      },
                      {
                        icon: Settings,
                        title: 'Cookie di Preferenza',
                        description: 'Per ricordare le tue preferenze',
                        color: 'purple'
                      },
                      {
                        icon: Cookie,
                        title: 'Cookie di Marketing',
                        description: 'Per mostrare contenuti personalizzati',
                        color: 'orange'
                      }
                    ].map((cookieType, index) => (
                      <div key={index} className={`bg-${cookieType.color}-50 border border-${cookieType.color}-200 rounded-lg p-4`}>
                        <div className={`p-2 bg-${cookieType.color}-100 rounded-full w-fit mb-3`}>
                          <cookieType.icon className={`w-5 h-5 text-${cookieType.color}-600`} />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {cookieType.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {cookieType.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* I tuoi diritti */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    I Tuoi Diritti (GDPR)
                  </h2>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      In conformità al GDPR, hai i seguenti diritti sui tuoi dati personali:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li><strong>Accesso:</strong> Richiedere copia dei tuoi dati</li>
                        <li><strong>Rettifica:</strong> Correggere dati inesatti</li>
                        <li><strong>Cancellazione:</strong> Richiedere la rimozione dei dati</li>
                        <li><strong>Limitazione:</strong> Limitare il trattamento</li>
                      </ul>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li><strong>Portabilità:</strong> Trasferire i dati ad altro servizio</li>
                        <li><strong>Opposizione:</strong> Opporti al trattamento</li>
                        <li><strong>Revoca consenso:</strong> Ritirare il consenso dato</li>
                        <li><strong>Reclamo:</strong> Presentare reclamo al Garante</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Sicurezza */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Sicurezza dei Dati
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Implementiamo misure di sicurezza tecniche e organizzative appropriate per 
                    proteggere i tuoi dati personali da accessi non autorizzati, perdita, 
                    distruzione o alterazione.
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Misure di Sicurezza
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Crittografia SSL/TLS per le comunicazioni</li>
                      <li>Accesso limitato ai dati su base need-to-know</li>
                      <li>Backup regolari e sicuri</li>
                      <li>Monitoraggio della sicurezza 24/7</li>
                      <li>Formazione del personale sulla privacy</li>
                    </ul>
                  </div>
                </section>

                {/* Contatti */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Contatti per la Privacy
                  </h2>
                  
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Per qualsiasi domanda relativa a questa informativa sulla privacy o 
                      per esercitare i tuoi diritti, puoi contattarci:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Titolare del Trattamento
                        </h3>
                        <p className="text-gray-700">
                          Kinetica Fisioterapia Genova<br />
                          Via Roma, 123<br />
                          16121 Genova (GE)<br />
                          Italia
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Contatti
                        </h3>
                        <p className="text-gray-700">
                          Email: privacy@kineticafisioterapia.it<br />
                          Telefono: +39 010 123 4567<br />
                          PEC: kinetica@pec.it
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Modifiche */}
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Modifiche a Questa Informativa
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed">
                    Ci riserviamo il diritto di aggiornare questa informativa sulla privacy. 
                    Ti informeremo di eventuali modifiche significative tramite email o tramite 
                    un avviso sul nostro sito web. Ti incoraggiamo a rivedere periodicamente 
                    questa informativa per rimanere informato su come proteggiamo i tuoi dati.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
