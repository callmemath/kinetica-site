import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook che scrolla automaticamente al top della pagina quando cambia la route
 */
export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Usa un piccolo delay per evitare conflitti con il rendering della pagina
    const scrollTimer = setTimeout(() => {
      // Scrolla istantaneamente al top senza animazione per evitare problemi di routing
      window.scrollTo(0, 0);
    }, 0);

    // Cleanup del timer
    return () => clearTimeout(scrollTimer);
  }, [location.pathname]); // Si attiva ogni volta che cambia il pathname
};

/**
 * Componente wrapper che applica automaticamente lo scroll al top
 * quando si naviga tra le pagine
 */
export const ScrollToTop = () => {
  useScrollToTop();
  return null;
};

export default useScrollToTop;
