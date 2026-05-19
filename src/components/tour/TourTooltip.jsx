import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTour } from './TourProvider';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TourTooltip({ highlightRect }) {
  const { activeTour, currentStep, nextStep, prevStep, closeTour } = useTour();
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const tx = (key, options) => t(`completeScoped.components_tour_TourTooltip.${key}`, options);
  useEffect(() => {
    if (!activeTour || !tooltipRef.current) return;

    const calculatePosition = () => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16;

      let top = padding;
      let left = padding;

      if (highlightRect) {
        const step = activeTour.steps[currentStep];
        const placement = step.placement || 'bottom';

        // Calculate position based on placement
        switch (placement) {
          case 'top':
            top = highlightRect.top - tooltipRect.height - padding;
            left = highlightRect.left + (highlightRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'bottom':
            top = highlightRect.top + highlightRect.height + padding;
            left = highlightRect.left + (highlightRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'left':
            top = highlightRect.top + (highlightRect.height / 2) - (tooltipRect.height / 2);
            left = highlightRect.left - tooltipRect.width - padding;
            break;
          case 'right':
            top = highlightRect.top + (highlightRect.height / 2) - (tooltipRect.height / 2);
            left = highlightRect.left + highlightRect.width + padding;
            break;
          default:
            top = highlightRect.top + highlightRect.height + padding;
            left = highlightRect.left + (highlightRect.width / 2) - (tooltipRect.width / 2);
        }

        // Adjust if out of viewport
        if (left < padding) left = padding;
        if (left + tooltipRect.width > viewportWidth - padding) {
          left = viewportWidth - tooltipRect.width - padding;
        }
        if (top < padding) top = padding;
        if (top + tooltipRect.height > viewportHeight - padding) {
          top = viewportHeight - tooltipRect.height - padding;
        }
      } else {
        // Center on screen if no highlight
        top = (viewportHeight - tooltipRect.height) / 2;
        left = (viewportWidth - tooltipRect.width) / 2;
      }

      setPosition({ top, left });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);

    return () => window.removeEventListener('resize', calculatePosition);
  }, [activeTour, currentStep, highlightRect]);

  if (!activeTour) return null;

  const step = activeTour.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === activeTour.steps.length - 1;

  const handleNext = () => {
    const routeAfterComplete = isLastStep ? activeTour?.afterCompleteRoute : null;
    nextStep();

    if (routeAfterComplete) {
      setTimeout(() => {
        navigate(routeAfterComplete);
      }, 0);
    }
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: '90vw',
        width: '400px',
      }}
    >
      <Card className="shadow-2xl border-2 border-[#ef6144]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">
                {tx('k1')} {currentStep + 1} {tx('k2')} {activeTour.steps.length}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-1"
              onClick={closeTour}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {step.content}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              {tx('k3')}
            </Button>

            <div className="flex gap-1">
              {activeTour.steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-[#ef6144]'
                      : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              size="sm"
              onClick={handleNext}
              className="bg-[#ef6144] hover:bg-[#ef6144]/90 gap-1"
            >
              {isLastStep ? tx('k4') : tx('k5')}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}