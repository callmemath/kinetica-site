import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useInView = (options: UseInViewOptions = {}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);
        
        if (inView && triggerOnce) {
          setHasTriggered(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref, isInView, hasTriggered };
};

export const useCountUp = (end: number, duration: number = 2000, delay: number = 0) => {
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const startTime = Date.now() + delay;
    const endTime = startTime + duration;

    const updateCount = () => {
      const now = Date.now();
      
      if (now < startTime) {
        requestAnimationFrame(updateCount);
        return;
      }

      if (now >= endTime) {
        setCount(end);
        return;
      }

      const progress = (now - startTime) / duration;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(end * easeOutProgress));
      
      requestAnimationFrame(updateCount);
    };

    requestAnimationFrame(updateCount);
  }, [end, duration, delay, isActive]);

  const start = () => setIsActive(true);
  const reset = () => {
    setCount(0);
    setIsActive(false);
  };

  return { count, start, reset };
};

export const useTypewriter = (text: string, speed: number = 50, delay: number = 0) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let timeout: number;
    
    const startTime = Date.now() + delay;
    let currentIndex = 0;

    const typeNextChar = () => {
      const now = Date.now();
      
      if (now < startTime) {
        timeout = setTimeout(typeNextChar, startTime - now);
        return;
      }

      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeout = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
      }
    };

    typeNextChar();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [text, speed, delay, isActive]);

  const start = () => setIsActive(true);
  const reset = () => {
    setDisplayText('');
    setIsComplete(false);
    setIsActive(false);
  };

  return { displayText, isComplete, start, reset };
};

// Advanced animation hook with multiple animation types
export const useAdvancedAnimation = (
  animationType: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn' | 'rotateIn' | 'flipIn' = 'fadeIn',
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  delay: number = 0,
  duration: number = 800
) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !isAnimated) {
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isInView, delay, isAnimated]);

  const getAnimationClass = useCallback(() => {
    if (!isAnimated) return 'opacity-0';

    const baseClass = `animate-${animationType}`;
    const directionClass = direction !== 'up' ? `-${direction}` : '';
    const durationClass = duration !== 800 ? ` animate-duration-${duration}` : '';

    return `${baseClass}${directionClass}${durationClass}`;
  }, [animationType, direction, duration, isAnimated]);

  return { ref, isAnimated, animationClass: getAnimationClass() };
};

// Scroll-triggered animations
export const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollY = () => {
      const currentScrollY = window.scrollY;
      setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
      setScrollY(currentScrollY);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', updateScrollY, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollY);
  }, []);

  return { scrollY, scrollDirection };
};

// Staggered animations for lists
export const useStaggeredAnimation = (
  itemCount: number,
  staggerDelay: number = 100,
  baseDelay: number = 0
) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [animatedItems, setAnimatedItems] = useState<boolean[]>(new Array(itemCount).fill(false));

  useEffect(() => {
    if (isInView) {
      animatedItems.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedItems(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        }, baseDelay + (index * staggerDelay));
      });
    }
  }, [isInView, itemCount, staggerDelay, baseDelay, animatedItems]);

  return { ref, animatedItems };
};

// Mouse movement parallax effect
export const useParallax = (intensity: number = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('translate3d(0px, 0px, 0px)');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * intensity;
      const deltaY = (e.clientY - centerY) * intensity;

      setTransform(`translate3d(${deltaX}px, ${deltaY}px, 0px)`);
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', () => {
        setTransform('translate3d(0px, 0px, 0px)');
      });

      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', () => {
          setTransform('translate3d(0px, 0px, 0px)');
        });
      };
    }
  }, [intensity]);

  return { ref, transform };
};

// Advanced hover animations
export const useHoverAnimation = (
  hoverType: 'lift' | 'scale' | 'rotate' | 'glow' | 'shake' | 'bounce' = 'lift'
) => {
  const [isHovered, setIsHovered] = useState(false);

  const getHoverClass = useCallback(() => {
    if (!isHovered) return '';

    switch (hoverType) {
      case 'lift': return 'hover-lift';
      case 'scale': return 'hover-scale';
      case 'rotate': return 'hover-rotate';
      case 'glow': return 'hover-glow';
      case 'shake': return 'animate-shake';
      case 'bounce': return 'animate-bounce';
      default: return '';
    }
  }, [hoverType, isHovered]);

  return {
    hoverClass: getHoverClass(),
    hoverProps: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    }
  };
};
