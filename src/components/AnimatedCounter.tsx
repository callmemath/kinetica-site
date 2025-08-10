import { useEffect } from 'react';
import { useInView, useCountUp } from '../hooks/useAnimations';

interface AnimatedCounterProps {
  end: number;
  label: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  animationType?: 'scale' | 'bounce' | 'fade' | 'slide';
  icon?: React.ReactNode;
}

const AnimatedCounter = ({ 
  end, 
  label, 
  duration = 2000, 
  prefix = '', 
  suffix = '', 
  className = '',
  animationType = 'scale',
  icon
}: AnimatedCounterProps) => {
  const { ref, isInView } = useInView({ threshold: 0.5 });
  const { count, start } = useCountUp(end, duration);

  useEffect(() => {
    if (isInView) {
      start();
    }
  }, [isInView, start]);

  const getAnimationClass = () => {
    switch (animationType) {
      case 'bounce': return 'animate-bounce-in';
      case 'fade': return 'animate-fade-in-up';
      case 'slide': return 'animate-slide-in-up';
      default: return 'animate-scale-in';
    }
  };

  return (
    <div 
      ref={ref} 
      className={`text-center group ${
        isInView ? getAnimationClass() : 'opacity-0'
      } ${className}`}
    >
      {icon && (
        <div className="mb-4 flex justify-center text-primary-600 group-hover:scale-110 transition-transform duration-300">
          <div className="text-4xl group-hover:animate-bounce">
            {icon}
          </div>
        </div>
      )}
      <div className="text-4xl lg:text-5xl font-bold text-primary-600 mb-2 animate-pulse-glow group-hover:animate-heartbeat"
           style={{
             background: 'none',
             backgroundColor: 'transparent',
             border: 'none',
             boxShadow: 'none',
             padding: 0,
             margin: '0 0 0.5rem 0'
           }}>
        {prefix}{count}{suffix}
      </div>
      <div className="text-gray-600 font-medium text-lg group-hover:text-primary-600 transition-colors duration-300">
        {label}
      </div>
    </div>
  );
};

export default AnimatedCounter;
