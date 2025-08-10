import type { ReactNode } from 'react';
import { useParallax, useScrollAnimation } from '../hooks/useAnimations';

interface ParallaxElementProps {
  children: ReactNode;
  intensity?: number;
  className?: string;
  scrollIntensity?: number;
}

const ParallaxElement = ({
  children,
  intensity = 0.1,
  className = '',
  scrollIntensity = 0
}: ParallaxElementProps) => {
  const { ref, transform } = useParallax(intensity);
  const { scrollY } = useScrollAnimation();

  const scrollTransform = scrollIntensity !== 0 
    ? `translateY(${scrollY * scrollIntensity}px)` 
    : '';

  const combinedTransform = scrollIntensity !== 0 
    ? `${transform} ${scrollTransform}` 
    : transform;

  return (
    <div
      ref={ref}
      className={`transition-transform duration-100 ease-out ${className}`}
      style={{
        transform: combinedTransform,
      }}
    >
      {children}
    </div>
  );
};

export default ParallaxElement;
