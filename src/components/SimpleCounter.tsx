import { useEffect } from 'react';
import { useInView, useCountUp } from '../hooks/useAnimations';

interface SimpleCounterProps {
  end: number;
  duration?: number;
  className?: string;
}

const SimpleCounter = ({ 
  end, 
  duration = 1000, 
  className = ''
}: SimpleCounterProps) => {
  const { ref, isInView } = useInView({ threshold: 0.5 });
  const { count, start } = useCountUp(end, duration);

  useEffect(() => {
    if (isInView) {
      start();
    }
  }, [isInView, start]);

  return (
    <span 
      ref={ref} 
      className={className}
    >
      {count}
    </span>
  );
};

export default SimpleCounter;
