import { useEffect, useRef } from 'react';
import { useTour } from './TourProvider';

/**
 * Component to automatically launch tours based on triggers
 * Use this in pages where tours should start
 */
export default function TourLauncher({ tourId, steps, trigger = true, delay = 500, afterCompleteRoute = null }) {
  const { startTour } = useTour();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!trigger || !tourId || !steps || hasStartedRef.current) return;

    const timer = setTimeout(() => {
      const success = startTour(tourId, steps, {
        afterCompleteRoute,
      });
      if (success) {
        hasStartedRef.current = true;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [tourId, trigger, afterCompleteRoute]);

  return null;
}