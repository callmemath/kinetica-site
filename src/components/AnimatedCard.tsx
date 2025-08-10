import type { ReactNode } from 'react';
import { useAdvancedAnimation, useHoverAnimation, useParallax } from '../hooks/useAnimations';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  animationType?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn' | 'rotateIn' | 'flipIn';
  hoverEffect?: 'lift' | 'scale' | 'rotate' | 'glow' | 'shake' | 'bounce';
  className?: string;
  enableParallax?: boolean;
  parallaxIntensity?: number;
  duration?: number;
}

const AnimatedCard = ({ 
  children, 
  delay = 0, 
  direction = 'up',
  animationType = 'fadeIn',
  hoverEffect = 'lift',
  className = '', 
  enableParallax = false,
  parallaxIntensity = 0.1,
  duration = 800
}: AnimatedCardProps) => {
  const { ref, animationClass } = useAdvancedAnimation(animationType, direction, delay, duration);
  const { hoverClass, hoverProps } = useHoverAnimation(hoverEffect);
  const { ref: parallaxRef, transform } = useParallax(parallaxIntensity);

  const combinedRef = (element: HTMLDivElement | null) => {
    if (ref.current !== element) {
      // @ts-ignore
      ref.current = element;
    }
    if (enableParallax && parallaxRef.current !== element) {
      // @ts-ignore
      parallaxRef.current = element;
    }
  };

  return (
    <div
      ref={combinedRef}
      className={`
        card
        ${animationClass}
        ${hoverClass}
        ${className}
      `}
      style={{
        transform: enableParallax ? transform : undefined,
        transition: enableParallax ? 'transform 0.1s ease-out' : undefined,
      }}
      {...hoverProps}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
