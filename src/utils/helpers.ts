// Utility functions for the Kinetica application

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatTime = (time: string): string => {
  return time.replace(':', '.');
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+39)?[\s-]?[0-9]{8,11}$/;
  return phoneRegex.test(phone);
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

export const getServiceColor = (category: string): string => {
  const colors: Record<string, string> = {
    fisioterapia: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg',
    osteopatia: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg',
    riabilitazione: 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg',
    ginnastica: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg',
    pilates: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg',
    massage: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg',
    wellness: 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-lg',
  };
  return colors[category] || 'bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg';
};

export const getServiceCardTheme = (category: string): string => {
  const themes: Record<string, string> = {
    fisioterapia: 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 hover:border-blue-400 hover:shadow-blue-200/50',
    osteopatia: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-100 hover:border-emerald-400 hover:shadow-emerald-200/50',
    riabilitazione: 'border-orange-200 bg-gradient-to-br from-orange-50 via-white to-red-100 hover:border-orange-400 hover:shadow-orange-200/50',
    ginnastica: 'border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-100 hover:border-purple-400 hover:shadow-purple-200/50',
    pilates: 'border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-100 hover:border-pink-400 hover:shadow-pink-200/50',
    massage: 'border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-100 hover:border-teal-400 hover:shadow-teal-200/50',
    wellness: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-100 hover:border-amber-400 hover:shadow-amber-200/50',
  };
  return themes[category] || 'border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-100 hover:border-gray-400 hover:shadow-gray-200/50';
};

export const getServiceSelectedTheme = (category: string): string => {
  const themes: Record<string, string> = {
    fisioterapia: 'border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200 shadow-blue-300/50',
    osteopatia: 'border-emerald-500 bg-gradient-to-br from-emerald-100 to-green-200 shadow-emerald-300/50',
    riabilitazione: 'border-orange-500 bg-gradient-to-br from-orange-100 to-red-200 shadow-orange-300/50',
    ginnastica: 'border-purple-500 bg-gradient-to-br from-purple-100 to-indigo-200 shadow-purple-300/50',
    pilates: 'border-pink-500 bg-gradient-to-br from-pink-100 to-rose-200 shadow-pink-300/50',
    massage: 'border-teal-500 bg-gradient-to-br from-teal-100 to-cyan-200 shadow-teal-300/50',
    wellness: 'border-amber-500 bg-gradient-to-br from-amber-100 to-yellow-200 shadow-amber-300/50',
  };
  return themes[category] || 'border-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 shadow-gray-300/50';
};
