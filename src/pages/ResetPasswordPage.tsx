import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Shield } from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';
import { apiService } from '../services/api';

interface ResetPasswordForm {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordPage = () => {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<ResetPasswordForm>();
  const { showSuccess, showError } = useToastContext();
  const navigate = useNavigate();

  const password = watch('newPassword');

  const onSubmitEmail = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    
    try {
      await apiService.forgotPassword(data.email);
      setCurrentEmail(data.email);
      setStep('reset');
      showSuccess(
        'Codice inviato!',
        'Controlla la tua email per il codice di reset'
      );
    } catch (error) {
      showError(
        'Errore invio codice',
        error instanceof Error ? error.message : 'Si è verificato un errore'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data: ResetPasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      showError(
        'Password non corrispondenti',
        'Le password inserite non coincidono'
      );
      return;
    }

    setIsLoading(true);
    
    try {
      await apiService.resetPassword(currentEmail, data.otp, data.newPassword);
      showSuccess(
        'Password reimpostata!',
        'La tua password è stata cambiata con successo'
      );
      navigate('/login');
    } catch (error) {
      showError(
        'Errore reset password',
        error instanceof Error ? error.message : 'Si è verificato un errore'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCurrentEmail('');
    reset();
  };

  const handleRequestNewCode = async () => {
    setIsLoading(true);
    
    try {
      await apiService.forgotPassword(currentEmail);
      showSuccess(
        'Nuovo codice inviato!',
        'Controlla la tua email per il nuovo codice'
      );
    } catch (error) {
      showError(
        'Errore invio codice',
        error instanceof Error ? error.message : 'Si è verificato un errore'
      );
    } finally {
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
          {step === 'email' ? 'Reimposta Password' : 'Nuova Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'email' ? (
            <>
              Inserisci la tua email per ricevere il codice di reset
            </>
          ) : (
            <>
              Codice inviato a{' '}
              <span className="font-medium text-primary-600">{currentEmail}</span>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'email' ? (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmitEmail)}>
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
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="inserisci@tuaemail.com"
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Invia Codice Reset
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmitReset)}>
              {/* OTP Field */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Codice di Reset
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
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-center text-lg tracking-wider"
                    placeholder="123456"
                  />
                  <Shield className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.otp && (
                  <p className="mt-2 text-sm text-red-600">{errors.otp.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nuova Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('newPassword', {
                      required: 'Password richiesta',
                      minLength: {
                        value: 6,
                        message: 'La password deve essere di almeno 6 caratteri'
                      }
                    })}
                    type="password"
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Almeno 6 caratteri"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.newPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Conferma Nuova Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Conferma la password',
                      validate: value => value === password || 'Le password non coincidono'
                    })}
                    type="password"
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ripeti la nuova password"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Reimposta Password
                    </>
                  )}
                </button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-primary-600 hover:text-primary-500 flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Cambia email
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleRequestNewCode}
                    disabled={isLoading}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    Reinvia codice
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Torna al login
            </Link>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Sicurezza garantita</h3>
              <p className="text-sm text-blue-700 mt-1">
                Il codice di reset è valido per 15 minuti e può essere utilizzato una sola volta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
