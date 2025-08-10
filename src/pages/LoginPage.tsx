import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../contexts/ToastContext';
import { isAdminOrStaff } from '../utils/roles';
import LoginSuccessAnimation from '../components/LoginSuccessAnimation';

interface LoginForm {
  email: string;
  password: string;
  otp: string;
}

const LoginPage = () => {
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginForm>();
  const { login, verifyLoginOtp } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const navigate = useNavigate();
  
  // Verifica se l'utente arriva dalla pagina di prenotazione
  const urlParams = new URLSearchParams(window.location.search);
  const isFromBooking = urlParams.get('redirect') === 'prenota' && urlParams.get('action') === 'complete-booking';
  const pendingBooking = isFromBooking ? JSON.parse(localStorage.getItem('pendingBooking') || '{}') : null;

  const handleAnimationComplete = () => {
    // Reindirizza in base al ruolo dell'utente e ai parametri URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    const action = urlParams.get('action');
    
    if (redirect === 'prenota' && action === 'complete-booking') {
      // Reindirizza alla pagina di prenotazione per completare la prenotazione
      navigate('/prenota?action=complete-booking');
      return;
    }
    
    // Logica di reindirizzamento normale
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      if (isAdminOrStaff(currentUser)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const onSubmit = async (data: LoginForm) => {
    console.log('🚀 FORM SUBMITTED - START OF onSubmit function');
    console.log('📝 Form data:', data);
    console.log('🔍 showOtp state:', showOtp);
    
    setIsLoading(true);
    
    try {
      if (!showOtp) {
        console.log('🚪 LoginPage: Starting login process...');
        // First step: login with email/password, this will send OTP
        const result = await login(data.email, data.password);
        console.log('🎯 LoginPage: Login result received:', result);
        
        if (result.requiresOtp) {
          console.log('📧 LoginPage: OTP required, showing OTP form');
          setCurrentEmail(data.email);
          setShowOtp(true);
          showSuccess(
            'Codice inviato!', 
            'Controlla la tua email per il codice di verifica'
          );
        } else {
          console.log('⚠️ LoginPage: Unexpected result - no OTP required');
        }
      } else {
        // Second step: verify OTP and complete login
        await verifyLoginOtp(currentEmail, data.otp);
        
        // Mostra animazione di successo invece del toast
        setShowSuccessAnimation(true);
        
        // La funzione di callback dell'animazione gestirà il redirect
      }
    } catch (error) {
      console.log('💥 LoginPage: Error caught:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore durante l\'accesso';
      console.log('📝 LoginPage: Showing error:', errorMessage);
      showError(
        'Errore di accesso',
        errorMessage
      );
    } finally {
      console.log('🏁 LoginPage: Finally block');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">K</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">Kinetica</h1>
              <p className="text-sm text-gray-600">Fisioterapia Genova</p>
            </div>
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {showOtp ? 'Verifica il codice' : 'Accedi al tuo account'}
        </h2>
        
        {/* Messaggio per prenotazione in sospeso */}
        {isFromBooking && pendingBooking && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-center">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                🗓️ Prenotazione in sospeso
              </h3>
              <p className="text-xs text-blue-600 mb-2">
                Effettua il login per completare la prenotazione di:
              </p>
              <div className="text-xs text-blue-700 font-medium">
                <p>{pendingBooking.serviceName}</p>
                <p>con {pendingBooking.staffName}</p>
                <p>{pendingBooking.date} alle {pendingBooking.startTime}</p>
              </div>
            </div>
          </div>
        )}
        
        <p className="mt-2 text-center text-sm text-gray-600">
          {showOtp ? (
            <>
              Abbiamo inviato un codice di verifica a{' '}
              <span className="font-medium text-primary-600">{watch('email')}</span>
            </>
          ) : (
            <>
              Non hai un account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Registrati qui
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('email', {
                    required: 'Email richiesta',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Email non valida'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  disabled={showOtp}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="inserisci@tuaemail.com"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            {!showOtp && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password', {
                      required: 'Password richiesta',
                      minLength: {
                        value: 6,
                        message: 'La password deve essere di almeno 6 caratteri'
                      }
                    })}
                    type="password"
                    autoComplete="current-password"
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Inserisci la tua password"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* OTP Field */}
            {showOtp && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Codice di verifica
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('otp', {
                      required: 'Codice richiesto',
                      minLength: {
                        value: 6,
                        message: 'Il codice deve essere di 6 cifre'
                      }
                    })}
                    type="text"
                    maxLength={6}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123456"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.otp && (
                  <p className="mt-2 text-sm text-red-600">{errors.otp.message}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Inserisci il codice di 6 cifre ricevuto via email
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {!showOtp ? (
                <>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex justify-center"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Accedi
                      </>
                    )}
                  </button>
                  
                  <div className="text-center">
                    <span className="text-sm text-gray-500">oppure</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🎯 DEMO LOGIN BUTTON CLICKED');
                      // Demo login diretto
                      const demoCredentials = { email: 'giulia@example.com', password: 'password1234', otp: '' };
                      onSubmit(demoCredentials);
                    }}
                    disabled={isLoading}
                    className="btn-secondary w-full flex justify-center"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Accesso diretto (Demo)
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex justify-center"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Accedi
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtp(false);
                      setShowOtp(false);
                    }}
                    className="w-full text-center text-sm text-primary-600 hover:text-primary-500"
                  >
                    Cambia email
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Demo Accounts Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Account Demo:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Paziente:</strong> paziente@demo.com</p>
              <p><strong>Staff:</strong> staff@kinetica.it</p>
              <p><strong>Codice OTP:</strong> 123456 (qualsiasi codice)</p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/reset-password"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Hai dimenticato la password?
            </Link>
            <div className="text-xs text-gray-500">
              <Link to="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
              {' • '}
              <Link to="/termini" className="hover:text-gray-700">Termini di Servizio</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animazione di successo login */}
      <LoginSuccessAnimation 
        show={showSuccessAnimation} 
        onComplete={handleAnimationComplete}
      />
    </div>
  );
};

export default LoginPage;
