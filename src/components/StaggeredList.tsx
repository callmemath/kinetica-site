import type { ReactNode } from 'react';
import { useStaggeredAnimation } from '../hooks/useAnimations';

interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  baseDelay?: number;
  animationType?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn';
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

const StaggeredList = ({
  children,
  staggerDelay = 150,
  baseDelay = 0,
  animationType = 'fadeIn',
  direction = 'up',
  className = ''
}: StaggeredListProps) => {
  const { ref, animatedItems } = useStaggeredAnimation(children.length, staggerDelay, baseDelay);

  const getAnimationClass = (index: number) => {
    if (!animatedItems[index]) return 'opacity-0 transform translate-y-8';

    switch (animationType) {
      case 'slideIn':
        return `animate-slide-in-${direction}`;
      case 'scaleIn':
        return 'animate-scale-in';
      case 'bounceIn':
        return 'animate-bounce-in';
      default:
        return `animate-fade-in-${direction}`;
    }
  };

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`${getAnimationClass(index)} transition-all duration-700 ease-out`}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default StaggeredList;
