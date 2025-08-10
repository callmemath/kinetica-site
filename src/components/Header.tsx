import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../contexts/ToastContext';
import { useStudioSettings } from '../hooks/useStudioSettings';
import { isAdminOrStaff } from '../utils/roles';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const { settings } = useStudioSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Chi Siamo', href: '/chi-siamo' },
    { name: 'Servizi', href: '/servizi' },
    { name: 'Collaborazioni', href: '/collaborazioni' },
    { name: 'Contatti', href: '/contatti' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout(() => navigate('/'));
      showSuccess('Logout effettuato', 'A presto!');
    } catch (error) {
      showError('Errore logout', 'Si è verificato un errore durante il logout');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 transition-all duration-300">
      <div className="container-max">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 group-hover:shadow-lg">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <div className="group-hover:translate-x-1 transition-transform duration-300">
              <h1 className="text-xl font-bold text-gray-900">{settings?.studioName || 'Kinetica'}</h1>
              <p className="text-sm text-gray-600">{settings?.studioDescription || 'Centro di fisioterapia'}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-all duration-300 hover:scale-105 relative group ${
                  isActive(item.href)
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                {item.name}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 transform origin-left transition-transform duration-300 ${
                  isActive(item.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></span>
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {isAdminOrStaff(user) ? (
                  <>
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                    >
                      <Shield className="w-4 h-4 group-hover:animate-bounce-gentle group-hover:rotate-12 transition-all duration-300" />
                      <span className="relative">
                        Dashboard
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                    >
                      <LogOut className="w-4 h-4 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                      <span className="relative">
                        Esci
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                    >
                      <User className="w-4 h-4 group-hover:animate-bounce-gentle group-hover:rotate-12 transition-all duration-300" />
                      <span className="relative">
                        Dashboard
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </Link>
                    <Link
                      to="/prenotazioni"
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                    >
                      <Calendar className="w-4 h-4 group-hover:animate-bounce-gentle group-hover:rotate-12 transition-all duration-300" />
                      <span className="relative">
                        Prenotazioni
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                    >
                      <LogOut className="w-4 h-4 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                      <span className="relative">
                        Esci
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Accedi
                </Link>
                <Link to="/prenota" className="btn-primary">
                  Prenota Ora
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 transition-all duration-300 hover:scale-110 hover:bg-gray-50 rounded-lg group"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="relative w-6 h-6">
              <Menu className={`w-6 h-6 absolute transition-all duration-300 ${
                isMenuOpen 
                  ? 'opacity-0 rotate-180 scale-50' 
                  : 'opacity-100 rotate-0 scale-100'
              }`} />
              <X className={`w-6 h-6 absolute transition-all duration-300 ${
                isMenuOpen 
                  ? 'opacity-100 rotate-0 scale-100' 
                  : 'opacity-0 rotate-180 scale-50'
              }`} />
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
          isMenuOpen 
            ? 'max-h-[500px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-1">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-base font-medium px-4 py-3 rounded-lg transition-all duration-300 hover:bg-gray-50 hover:translate-x-2 transform ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600'
                  } ${
                    isMenuOpen 
                      ? 'translate-y-0 opacity-100' 
                      : 'translate-y-4 opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: isMenuOpen ? `${index * 100 + 150}ms` : '0ms'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <div className={`flex flex-col space-y-1 pt-4 mt-4 border-t border-gray-200 transform transition-all duration-300 ${
                  isMenuOpen 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
                style={{ 
                  transitionDelay: isMenuOpen ? '650ms' : '0ms'
                }}>
                  {isAdminOrStaff(user) ? (
                    <>
                      <Link
                        to="/admin"
                        className="flex items-center space-x-3 text-primary-600 px-4 py-3 rounded-lg hover:bg-primary-50 transition-all duration-300 hover:translate-x-2 group relative overflow-hidden"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                        <span className="relative">
                          Dashboard Admin
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                        </span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-3 text-primary-600 px-4 py-3 rounded-lg hover:bg-primary-50 transition-all duration-300 hover:translate-x-2 group relative overflow-hidden"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                        <span className="relative">
                          Dashboard
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                        </span>
                      </Link>
                      <Link
                        to="/prenotazioni"
                        className="flex items-center space-x-3 text-primary-600 px-4 py-3 rounded-lg hover:bg-primary-50 transition-all duration-300 hover:translate-x-2 group relative overflow-hidden"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Calendar className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                        <span className="relative">
                          Le mie prenotazioni
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                        </span>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 text-gray-600 hover:text-red-600 justify-start px-4 py-3 rounded-lg hover:bg-red-50 transition-all duration-300 hover:translate-x-2 group relative overflow-hidden"
                  >
                    <LogOut className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                    <span className="relative">
                      Esci
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </button>
                </div>
              ) : (
                <div className={`flex flex-col space-y-3 pt-4 mt-4 border-t border-gray-200 transform transition-all duration-300 ${
                  isMenuOpen 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
                style={{ 
                  transitionDelay: isMenuOpen ? '650ms' : '0ms'
                }}>
                  <Link
                    to="/login"
                    className="btn-secondary text-center px-4 py-3 transform transition-all duration-300 hover:scale-105"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Accedi
                  </Link>
                  <Link
                    to="/prenota"
                    className="btn-primary text-center px-4 py-3 transform transition-all duration-300 hover:scale-105"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Prenota Ora
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
