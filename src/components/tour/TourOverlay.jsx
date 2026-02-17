import React, { useEffect, useState, useRef } from 'react';
import { useTour } from './TourProvider';
import TourTooltip from './TourTooltip';

export default function TourOverlay() {
  const { activeTour, currentStep, isVisible } = useTour();
  const [highlightRect, setHighlightRect] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !activeTour) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
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
        setHighlightRect(null);
      }
    };

    // Initial update
    updateHighlight();

    // Update on window resize or scroll
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [isVisible, activeTour, currentStep]);

  if (!isVisible || !activeTour) return null;

  // Only show overlay (backdrop + spotlight) when highlighting a specific element
  // For center placement (no target), only show tooltip
  const hasTarget = activeTour.steps[currentStep]?.target;

  return (
    <>
      {/* Overlay backdrop + spotlight - only show when there's a target element */}
      {hasTarget && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-[9998] pointer-events-none"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Spotlight hole */}
          {highlightRect && (
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
          )}
        </div>
      )}

      {/* Tooltip */}
      <TourTooltip highlightRect={hasTarget ? highlightRect : null} />
    </>
  );
}