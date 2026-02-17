import { useEffect } from 'react';
import { useTour } from './TourProvider';

/**
 * Component to automatically launch tours based on triggers
 * Use this in pages where tours should start
 */
export default function TourLauncher({ tourId, steps, trigger = true, delay = 500 }) {
  const { startTour } = useTour();

  useEffect(() => {
    if (!trigger || !tourId || !steps) return;

    const timer = setTimeout(() => {
      startTour(tourId, steps);
    }, delay);

    return () => clearTimeout(timer);
  }, [tourId, steps, trigger, delay, startTour]);

  return null;
}