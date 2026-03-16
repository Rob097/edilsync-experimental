import React, { createContext, useContext, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

export default function TourProvider({ children }) {
  const queryClient = useQueryClient();
  const [activeTour, setActiveTour] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const updateTourState = useMutation({
    mutationFn: (tourState) => appClient.auth.updateMe({ tour_state: tourState }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const tourState = user?.tour_state || {
    onboarding_completed: false,
    onboarding_dismissed: false,
    projects_completed: false,
    projects_dismissed: false,
    companies_completed: false,
    companies_dismissed: false,
    essential_onboarding_completed: false,
    essential_onboarding_dismissed: false,
  };

  const startTour = (tourId, steps, options = {}) => {
    // Check if tour is already completed or dismissed
    const completedKey = `${tourId}_completed`;
    const dismissedKey = `${tourId}_dismissed`;

    if (!options.force && (tourState[completedKey] || tourState[dismissedKey])) {
      return false;
    }

    setActiveTour({ id: tourId, steps, ...options });
    setCurrentStep(0);
    setIsVisible(true);
    return true;
  };

  const nextStep = () => {
    if (!activeTour) return;
    
    if (currentStep < activeTour.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeTour = () => {
    if (activeTour) {
      const dismissedKey = `${activeTour.id}_dismissed`;
      updateTourState.mutate({
        ...tourState,
        [dismissedKey]: true,
      });
    }
    setIsVisible(false);
    setActiveTour(null);
    setCurrentStep(0);
  };

  const completeTour = () => {
    if (activeTour) {
      const completedKey = `${activeTour.id}_completed`;
      updateTourState.mutate({
        ...tourState,
        [completedKey]: true,
      });
    }
    setIsVisible(false);
    setActiveTour(null);
    setCurrentStep(0);
  };

  const resetTour = (tourId) => {
    const completedKey = `${tourId}_completed`;
    const dismissedKey = `${tourId}_dismissed`;
    updateTourState.mutate({
      ...tourState,
      [completedKey]: false,
      [dismissedKey]: false,
    });
  };

  const value = {
    activeTour,
    currentStep,
    isVisible,
    tourState,
    startTour,
    nextStep,
    prevStep,
    closeTour,
    completeTour,
    resetTour,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}