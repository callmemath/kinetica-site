import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedText from '../components/AnimatedText';
import ParallaxElement from '../components/ParallaxElement';
import { useAdvancedAnimation } from '../hooks/useAnimations';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../contexts/ToastContext';
import logoImage from '../assets/logo.png';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  otp: string;
}

const RegisterPage = () => {
  const { ref: heroRef, animationClass: heroAnimation } = useAdvancedAnimation('fadeIn', 'up', 200);
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();
  const { register: registerUser, verifyRegistrationOtp } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const navigate = useNavigate();

  const password = watch('password');

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score, label: 'Debole', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Media', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Forte', color: 'bg-green-500' };
    return { score, label: 'Molto Forte', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    
    try {
      if (!otpSent) {
        // First step: validate and register user, this will send OTP
        if (data.password !== data.confirmPassword) {
          showError(
            'Password non corrispondenti',
            'Le password inserite non coincidono. Ricontrolla.'
          );
          return;
        }
        
        const result = await registerUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          password: data.password
        });
        
        if (result.requiresVerification) {
          setOtpSent(true);
          setShowOtp(true);
          showSuccess(
            'Account creato!',
            'Controlla la tua email per il codice di verifica.'
          );
        }
      } else {
        // Second step: verify OTP and complete registration
        await verifyRegistrationOtp(data.email, data.otp);
        showSuccess(
          'Registrazione completata!',
          'Benvenuto in Kinetica Fisioterapia!'
        );
        navigate('/');
      }
    } catch (error) {
      showError(
        'Errore registrazione',
        error instanceof Error ? error.message : 'Si è verificato un errore. Riprova.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    const formData = watch();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      showError(
        'Campi obbligatori mancanti',
        'Compila tutti i campi contrassegnati con * per continuare.'
      );
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showError(
        'Email non valida',
        'Inserisci un indirizzo email valido.'
      );
      return;
    }
    
    if (formData.password.length < 6) {
      showError(
        'Password troppo corta',
        'La password deve essere di almeno 6 caratteri.'
      );
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      showError(
        'Password non corrispondenti',
        'Le password inserite non coincidono.'
      );
      return;
    }
    
    if (!formData.terms) {
      showError(
        'Termini non accettati',
        'Devi accettare i termini e condizioni per continuare.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      if (result.requiresVerification) {
        setOtpSent(true);
        setShowOtp(true);
        showSuccess(
          'Codice inviato!',
          'Controlla la tua email per il codice di verifica.'
        );
      }
    } catch (error) {
      showError(
        'Errore invio codice',
        error instanceof Error ? error.message : 'Si è verificato un errore. Riprova.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Floating background elements */}
      <ParallaxElement intensity={0.03} className="fixed inset-0 pointer-events-none z-0">
        <div className="animate-float absolute top-20 left-20 w-24 h-24 bg-primary-200 rounded-full opacity-20"></div>
        <div className="animate-float absolute top-40 right-32 w-20 h-20 bg-warm-300 rounded-full opacity-15" style={{animationDelay: '2s'}}></div>
      </ParallaxElement>

      <div className="relative z-10 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div ref={heroRef} className={`flex justify-center ${heroAnimation}`}>
            <div className="flex items-center space-x-2 animate-fade-in-up">
              <img 
                src={logoImage} 
                alt="Kinetica Logo" 
                className="w-12 h-12 rounded-lg object-contain group-hover:scale-110 transition-transform duration-300"
              />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">Kinetica</h1>
                <p className="text-sm text-gray-600">Fisioterapia Genova</p>
              </div>
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 animate-fade-in-up animate-delay-300">
            {otpSent ? 'Verifica la tua email' : (
              <>Crea il tuo <AnimatedText text="account" className="text-primary-600" delay={800} speed={60} /></>
            )}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 animate-fade-in-up animate-delay-500">
            {otpSent ? (
              <>
                Abbiamo inviato un codice di verifica a{' '}
                <span className="font-medium text-primary-600">{watch('email')}</span>
              </>
            ) : (
              <>
                Hai già un account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  Accedi qui
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <AnimatedCard delay={600} className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {!showOtp ? (
                <>
                  {/* Personal Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        Nome *
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...register('firstName', { 
                            required: 'Il nome è obbligatorio',
                            minLength: { value: 2, message: 'Il nome deve essere di almeno 2 caratteri' }
                          })}
                          type="text"
                          className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Mario"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Cognome *
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...register('lastName', { 
                            required: 'Il cognome è obbligatorio',
                            minLength: { value: 2, message: 'Il cognome deve essere di almeno 2 caratteri' }
                          })}
                          type="text"
                          className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Rossi"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('email', { 
                          required: 'L\'email è obbligatoria',
                          pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: 'Inserisci un indirizzo email valido'
                          }
                        })}
                        type="email"
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="mario.rossi@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Telefono
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('phone', {
                          pattern: {
                            value: /^[\+]?[\d\s\-\(\)]{10,}$/,
                            message: 'Inserisci un numero di telefono valido'
                          }
                        })}
                        type="tel"
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="+39 123 456 7890"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('password', { 
                          required: 'La password è obbligatoria',
                          minLength: { value: 6, message: 'La password deve essere di almeno 6 caratteri' }
                        })}
                        type={showPassword ? 'text' : 'password'}
                        className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Almeno 6 caratteri"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    {password && password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sicurezza password:</span>
                          <span className={`font-medium ${
                            passwordStrength.score <= 2 ? 'text-red-600' : 
                            passwordStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Conferma Password *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('confirmPassword', { 
                          required: 'Conferma la password',
                          validate: value => value === password || 'Le password non coincidono'
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ripeti la password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-center">
                    <input
                      {...register('terms', { required: 'Devi accettare i termini e condizioni' })}
                      id="terms"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                      Accetto i{' '}
                      <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                        termini e condizioni
                      </Link>{' '}
                      e la{' '}
                      <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                        privacy policy
                      </Link>
                    </label>
                  </div>
                  {errors.terms && (
                    <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isLoading}
                      className="btn-primary w-full group"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creazione account...
                        </div>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 mr-2 group-hover:animate-bounce-gentle" />
                          Crea Account
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Verification */}
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                      Codice di Verifica
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('otp', { 
                          required: 'Inserisci il codice di verifica',
                          pattern: {
                            value: /^\d{6}$/,
                            message: 'Il codice deve essere di 6 cifre'
                          }
                        })}
                        type="text"
                        maxLength={6}
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-center text-lg tracking-wider"
                        placeholder="123456"
                      />
                    </div>
                    {errors.otp && (
                      <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
                    )}
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full group"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Verifica in corso...
                        </div>
                      ) : (
                        <>
                          <User className="w-5 h-5 mr-2 group-hover:animate-bounce-gentle" />
                          Completa Registrazione
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      Non hai ricevuto il codice? Reinvia
                    </button>
                  </div>
                </>
              )}
            </form>
          </AnimatedCard>
        </div>

        {/* Security Info */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <AnimatedCard delay={800} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">I tuoi dati sono al sicuro</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Utilizziamo la crittografia SSL e sistemi di sicurezza avanzati per proteggere le tue informazioni personali.
                </p>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
