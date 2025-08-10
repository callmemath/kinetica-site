import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../contexts/ToastContext';
import { apiService } from '../services/api';
import AnimatedCard from '../components/AnimatedCard';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Nome troppo corto'),
  lastName: z.string().min(2, 'Cognome troppo corto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalNotes: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Password attuale richiesta'),
  newPassword: z.string().min(8, 'Minimo 8 caratteri'),
  confirmPassword: z.string().min(1, 'Conferma password richiesta'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      address: user?.address || '',
      city: user?.city || '',
      postalCode: user?.postalCode || '',
      emergencyContact: user?.emergencyContact || '',
      medicalNotes: user?.medicalNotes || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        emergencyContact: user.emergencyContact || '',
        medicalNotes: user.medicalNotes || '',
      });
    }
  }, [user, profileForm]);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const response = await apiService.updateProfile(data);
      
      if (response.success && response.data) {
        // Update user in auth context
        updateUser(response.data);
        
        showSuccess(
          'Profilo aggiornato',
          'Le tue informazioni sono state salvate con successo'
        );
        setIsEditing(false);
      } else {
        throw new Error(response.message || 'Errore durante l\'aggiornamento');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      showError(
        'Errore',
        error.message || 'Non è stato possibile aggiornare il profilo'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoadingPassword(true);
    try {
      const response = await apiService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      if (response.success) {
        showSuccess(
          'Password aggiornata',
          'La tua password è stata modificata con successo'
        );
        setIsChangingPassword(false);
        passwordForm.reset();
      } else {
        throw new Error(response.message || 'Errore durante il cambio password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      showError(
        'Errore',
        error.message || 'Non è stato possibile aggiornare la password'
      );
    } finally {
      setIsLoadingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accesso richiesto</h1>
          <Link to="/login" className="btn-primary">
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container-max px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Il Mio Profilo</h1>
            <p className="text-gray-600">
              Gestisci le tue informazioni personali e le impostazioni dell'account
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <AnimatedCard delay={0}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Informazioni Personali</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Annulla</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>Modifica</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      {...profileForm.register('firstName')}
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-red-600 text-sm mt-1">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cognome
                    </label>
                    <input
                      {...profileForm.register('lastName')}
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-red-600 text-sm mt-1">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    {...profileForm.register('email')}
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-red-600 text-sm mt-1">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono
                    </label>
                    <input
                      {...profileForm.register('phone')}
                      disabled={!isEditing}
                      placeholder="+39 123 456 7890"
                      className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data di Nascita
                    </label>
                    <input
                      {...profileForm.register('dateOfBirth')}
                      type="date"
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo
                  </label>
                  <input
                    {...profileForm.register('address')}
                    disabled={!isEditing}
                    placeholder="Via, Numero civico"
                    className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Città
                    </label>
                    <input
                      {...profileForm.register('city')}
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Codice Postale
                    </label>
                    <input
                      {...profileForm.register('postalCode')}
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contatto di Emergenza
                  </label>
                  <input
                    {...profileForm.register('emergencyContact')}
                    disabled={!isEditing}
                    placeholder="Nome e telefono del contatto di emergenza"
                    className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Mediche
                  </label>
                  <textarea
                    {...profileForm.register('medicalNotes')}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Allergie, condizioni mediche, farmaci assunti..."
                    className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                      disabled={isLoading}
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex items-center"
                      disabled={isLoading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Salvando...' : 'Salva Modifiche'}
                    </button>
                  </div>
                )}
              </form>
            </AnimatedCard>

            {/* Security Settings */}
            <AnimatedCard delay={200}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Sicurezza</h2>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <Shield className="w-4 h-4" />
                  <span>Cambia Password</span>
                </button>
              </div>

              {isChangingPassword && (
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Attuale
                    </label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('currentPassword')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="input-field pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-red-600 text-sm mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nuova Password
                    </label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('newPassword')}
                        type={showNewPassword ? 'text' : 'password'}
                        className="input-field pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-red-600 text-sm mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conferma Nuova Password
                    </label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="input-field pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-red-600 text-sm mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="btn-secondary"
                      disabled={isLoadingPassword}
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isLoadingPassword}
                    >
                      {isLoadingPassword ? 'Aggiornando...' : 'Aggiorna Password'}
                    </button>
                  </div>
                </form>
              )}
            </AnimatedCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <AnimatedCard delay={300}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Account</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-600">Cliente</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Registrato il {new Date().toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
