// updated: this is a new file
import OnboardingLayout from "../components/OnboardingLayout";

import logo from "../assets/logo.png"; 

export default function OnboardingLogo({ onNext, onSkip }) {
  return (
    <OnboardingLayout
      image={logo}
      title="Welcome to TripMemo"
      subtitle="Capture your solo adventures, save your favourite spots, and keep all your memories in one place."
      onNext={onNext}
      onSkip={onSkip}
      currentIndex={0}   
      total={4}         
      primaryCtaLabel="Get Started"
    />
  );
}
