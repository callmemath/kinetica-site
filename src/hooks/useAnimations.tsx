import { useEffect, useRef, useState, useCallback } from 'react';

// Hook per osservare quando un elemento entra nel viewport
export const useInView = (thresholdOrOptions: number | { threshold: number } = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const threshold = typeof thresholdOrOptions === 'number' 
      ? thresholdOrOptions 
      : thresholdOrOptions.threshold;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [thresholdOrOptions]);

  return { ref, isInView };
};

// Hook per animazioni di conteggio
export const useCountUp = (end: number, duration: number = 2000, start: number = 0) => {
  const [count, setCount] = useState(start);
  const [isActive, setIsActive] = useState(false);

  const startAnimation = useCallback(() => {
    if (isActive) return;
    
    setIsActive(true);
    const startTime = Date.now();
    const startValue = start;
    const endValue = end;

    const updateCount = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
      
      setCount(current);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [end, duration, start, isActive]);

  const reset = useCallback(() => {
    setCount(start);
    setIsActive(false);
  }, [start]);

  return { count, start: startAnimation, startAnimation, reset };
};

// Hook per animazioni avanzate
export const useAdvancedAnimation = (
  animationType?: string, 
  _direction?: string, 
  delay: number = 0, 
  duration?: number
) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [delay]);

  // Genera la classe CSS per l'animazione
  const animationClass = isVisible 
    ? `animate-${animationType || 'fadeIn'} animate-duration-${duration || 500}` 
    : 'opacity-0';

  return { ref, isVisible, animationClass };
};

// Hook per animazioni hover
export const useHoverAnimation = (hoverEffect?: string) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const hoverClass = isHovered 
    ? `hover:${hoverEffect || 'scale-105'} transition-transform` 
    : 'transition-transform';

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false)
  };

  return { ref, isHovered, hoverClass, hoverProps };
};

// Hook per effetti parallax
export const useParallax = (speed: number = 0.5) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const element = ref.current;
      if (!element) return;

      const scrolled = window.pageYOffset;
      const rate = scrolled * speed;
      
      setOffset(rate);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  const transform = `translateY(${offset}px)`;

  return { ref, offset, transform };
};

// Hook per animazioni di scroll
export const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    const handleScroll = () => {
      setScrollY(window.pageYOffset);
      setIsScrolling(true);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return { scrollY, isScrolling };
};

// Hook per animazioni staggered (sfasate)
export const useStaggeredAnimation = (
  itemCount: number, 
  staggerDelay: number = 100, 
  baseDelay: number = 0
) => {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false));
  const [isTriggered, setIsTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const trigger = useCallback(() => {
    if (isTriggered) return;
    
    setIsTriggered(true);
    
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setVisibleItems(prev => {
          const newState = [...prev];
          newState[i] = true;
          return newState;
        });
      }, baseDelay + (i * staggerDelay));
    }
  }, [itemCount, staggerDelay, baseDelay, isTriggered]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trigger();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [trigger]);

  const reset = useCallback(() => {
    setVisibleItems(new Array(itemCount).fill(false));
    setIsTriggered(false);
  }, [itemCount]);

  // Mantieni compatibilità con l'API esistente
  const animatedItems = visibleItems;

  return { ref, visibleItems, animatedItems, trigger, reset };
};

// Hook per animazioni di fade
export const useFadeAnimation = (delay: number = 0) => {
  const [opacity, setOpacity] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            setOpacity(1);
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [delay]);

  return { ref, opacity, isVisible };
};

// Hook per animazioni di slide
export const useSlideAnimation = (direction: 'left' | 'right' | 'up' | 'down' = 'up', delay: number = 0) => {
  const [transform, setTransform] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getInitialTransform = () => {
      switch (direction) {
        case 'left': return 'translateX(-50px)';
        case 'right': return 'translateX(50px)';
        case 'up': return 'translateY(50px)';
        case 'down': return 'translateY(-50px)';
        default: return 'translateY(50px)';
      }
    };

    setTransform(getInitialTransform());

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            setTransform('translate(0, 0)');
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [direction, delay]);

  return { ref, transform, isVisible };
};
