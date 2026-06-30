

import React from "react";

export const OnboardingPage: React.FC = () => {
  // Onboarding now primarily drives face enrollment for new accounts.
  // Direct users to the real biometric capture step.
  if (typeof window !== 'undefined') {
    window.location.replace('/onboarding/face-registration');
  }
  return <div className="p-8 text-white">Redirecionando para cadastro facial...</div>;
};
