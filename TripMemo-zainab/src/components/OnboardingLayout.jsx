export default function OnboardingLayout({
  image,
  title,
  subtitle,
  onNext,
  onSkip,
  currentIndex,
  total,
  isLast,
}) {
  return (
    <div className="onboard-container">
      
      {/* IMAGE BOX */}
      <div className="onboard-image-wrapper">
        <img src={image} alt="onboarding" className="onboard-image" />
      </div>

      {/* TEXT */}
      <h1 className="onboard-title">{title}</h1>
      <p className="onboard-subtitle">{subtitle}</p>

      {/* FOOTER */}
      <div className="onboard-footer">
        <button className="onboard-skip" onClick={onSkip}>
          Skip
        </button>

        <div className="onboard-dots">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`onboard-dot ${i === currentIndex ? "active" : ""}`}
            />
          ))}
        </div>

        {isLast ? (
          <button className="onboard-start" onClick={onNext}>
            Get Started
          </button>
        ) : (
          <button className="onboard-next" onClick={onNext}>
            →
          </button>
        )}
      </div>
    </div>
  );
}
