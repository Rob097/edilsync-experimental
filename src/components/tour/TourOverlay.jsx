import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTour } from './TourProvider';
import TourTooltip from './TourTooltip';

export default function TourOverlay() {
  const { activeTour, currentStep, isVisible } = useTour();
  const location = useLocation();
  const [highlightRect, setHighlightRect] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !activeTour) {
      setHighlightRect(null);
      return;
    }

    const retryTimeouts = [];

    const updateHighlight = (allowRetry = false, attempt = 0) => {
      const step = activeTour.steps[currentStep];
      if (!step.target) {
        setHighlightRect(null);
        return;
      }

      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = step.padding || 8;
        
        setHighlightRect({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Scroll element into view if needed
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      } else {
        if (allowRetry && attempt < 20) {
          const timeoutId = setTimeout(() => {
            updateHighlight(true, attempt + 1);
          }, 150);
          retryTimeouts.push(timeoutId);
          return;
        }

        setHighlightRect(null);
      }
    };

    // Initial update
    updateHighlight(true, 0);

    // Update on window resize or scroll
    const handleWindowChange = () => updateHighlight(false, 0);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      retryTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isVisible, activeTour, currentStep, location.pathname, location.search]);

  if (!isVisible || !activeTour) return null;

  const hasTarget = activeTour.steps[currentStep]?.target;

  return (
    <>
      {/* Overlay backdrop - show only when NO target (popup centrale) */}
      {!hasTarget && (
        <div 
          className="fixed inset-0 z-[9998] pointer-events-none"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        />
      )}

      {/* Spotlight - show only when there's a target element */}
      {hasTarget && highlightRect && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9998] pointer-events-none"
        >
          <div
            className="absolute transition-all duration-300 rounded-lg pointer-events-auto"
            style={{
              top: `${highlightRect.top}px`,
              left: `${highlightRect.left}px`,
              width: `${highlightRect.width}px`,
              height: `${highlightRect.height}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3), 0 0 20px rgba(239, 97, 68, 0.5)',
              border: '2px solid #ef6144',
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      <TourTooltip highlightRect={hasTarget ? highlightRect : null} />
    </>
  );
}