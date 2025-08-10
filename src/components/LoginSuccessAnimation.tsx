import React from 'react';
import { Check, Sparkles, Heart } from 'lucide-react';

interface LoginSuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

const LoginSuccessAnimation: React.FC<LoginSuccessAnimationProps> = ({ show, onComplete }) => {
  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000); // Animazione più lunga per godersi l'effetto
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 backdrop-blur-sm">
      {/* Coriandoli animati */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute animate-confetti-${i % 4} opacity-80`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            {i % 4 === 0 && <Sparkles className="w-4 h-4 text-yellow-400" />}
            {i % 4 === 1 && <Heart className="w-3 h-3 text-pink-400" />}
            {i % 4 === 2 && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
            {i % 4 === 3 && <div className="w-2 h-2 bg-indigo-400 rounded-full" />}
          </div>
        ))}
      </div>

      {/* Card principale */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center transform animate-bounce-in relative overflow-hidden">
        {/* Gradient decorativo */}
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-600"></div>
        
        {/* Cerchio principale con effetti */}
        <div className="relative mx-auto mb-6">
          {/* Anelli colorati che si espandono */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-ping"></div>
            <div className="absolute w-20 h-20 border-4 border-indigo-200 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute w-16 h-16 border-4 border-sky-200 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
          
          {/* Cerchio principale con gradiente */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Check 
              className="w-10 h-10 text-white animate-checkmark" 
              strokeWidth={3}
            />
          </div>
          
          {/* Stelle decorative */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-spin-slow" />
          </div>
          <div className="absolute -bottom-2 -left-2">
            <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
          </div>
        </div>

        {/* Testo con emoji e gradiente */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-slide-in-up">
            🎉 Benvenuto! 🎉
          </h3>
          <p className="text-gray-600 animate-fade-in-up-delay text-lg">
            Accesso effettuato con successo
          </p>
          <div className="flex justify-center space-x-1 animate-fade-in-up-delay-2">
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🩼</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>💙</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</span>
          </div>
        </div>

        {/* Barra di caricamento arcobaleno */}
        <div className="mt-6">
          <div className="text-sm text-gray-500 mb-2 animate-fade-in-up-delay-2">
            Preparazione del tuo spazio personale...
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 rounded-full animate-rainbow-bar shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessAnimation;
