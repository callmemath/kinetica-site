import { useEffect, useState } from 'react';
import { useInView } from '../hooks/useAnimations';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

const AnimatedText = ({ text, className = '', delay = 0, speed = 50 }: AnimatedTextProps) => {
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isInView || currentIndex >= text.length) return;

    const timer = setTimeout(() => {
      setDisplayText(text.slice(0, currentIndex + 1));
      setCurrentIndex(prev => prev + 1);
    }, delay + (currentIndex * speed));

    return () => clearTimeout(timer);
  }, [isInView, currentIndex, text, delay, speed]);

  useEffect(() => {
    if (isInView) {
      setCurrentIndex(0);
      setDisplayText('');
    }
  }, [isInView]);

  return (
    <span ref={ref} className={className}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse text-primary-600">|</span>
      )}
    </span>
  );
};

export default AnimatedText;
