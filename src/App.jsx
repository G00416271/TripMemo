import React, { useState } from "react";
import "./App.css";
import "./onboarding.css";

import Onboarding1 from "./onboarding/Onboarding1";
import Onboarding2 from "./onboarding/Onboarding2";
import Onboarding3 from "./onboarding/Onboarding3";

import {
  FiMenu,
  FiSliders,
  FiBookmark,
  FiUser,
  FiMapPin,
  FiMessageCircle,
} from "react-icons/fi";
import {
  AiOutlineSearch,
  AiOutlineHeart,
  AiFillHome,
} from "react-icons/ai";
import {
  MdFlight,
  MdHotel,
  MdTrain,
  MdDirectionsBus,
  MdEmergency,
  MdCollectionsBookmark,
} from "react-icons/md";
import { IoIosAirplane } from "react-icons/io";

import SideMenu from "./SideMenu";

const scrapbooks = [
  { id: 1, city: "Paris", date: "27/08/2025", country: "France" },
  { id: 2, city: "Brussles", date: "06/09/2025", country: "Belgium" },
];

const bucketList = [
  { id: 1, title: "Tokyo", location: "Japan" },
  { id: 2, title: "New York", location: "USA" },
];

const PLACEHOLDER_AVATAR =
  "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // NEW: track which onboarding screen the user is on
  const [onboardingStep, setOnboardingStep] = useState(0);

  const handleNextOnboarding = () =>
    setOnboardingStep((prev) => prev + 1);

  const handleSkipOnboarding = () => setOnboardingStep(3); // jump to main app

  // --- SHOW ONBOARDING FIRST ---

  if (onboardingStep === 0) {
  return (
    <div className="app-root">
      <Onboarding1
        onNext={handleNextOnboarding}
        onSkip={handleSkipOnboarding}
      />
    </div>
  );
}

if (onboardingStep === 1) {
  return (
    <div className="app-root">
      <Onboarding2
        onNext={handleNextOnboarding}
        onSkip={handleSkipOnboarding}
      />
    </div>
  );
}

if (onboardingStep === 2) {
  return (
    <div className="app-root">
      <Onboarding3
        onNext={handleNextOnboarding}
        onSkip={handleSkipOnboarding}
      />
    </div>
  );
}


  // --- After onboarding is done, show your main TripMemo home screen ---
  return (
    <div className="app-root">
      <div className="phone-shell">
        <div className="phone-inner">
          {/* HEADER */}
          <header className="header">
            <div className="header-left">
              <img
                className="avatar"
                src={PLACEHOLDER_AVATAR}
                alt="Profile"
              />
              <div>
                <p className="hey-text">Hello, User 👋</p>
              </div>
            </div>

            {/* Hamburger button */}
            <button
              className="icon-pill"
              onClick={() => setIsMenuOpen(true)}
            >
              <FiMenu />
            </button>
          </header>

          {/* SLIDE-OUT MENU */}
          <SideMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />

          {/* SEARCH */}
          <section className="search-section">
            <div className="search-bar">
              <AiOutlineSearch className="search-icon" />
              <input
                type="text"
                placeholder="Find things you interested in"
              />
            </div>

            {/* <button className="fab-filter">
              <FiSliders />
            </button> */}
          </section>

          <main className="content">
            {/* "booking" / CTA section */}
            <SectionHeader title="Create Your Next Adventure..." />
            <div className="book-row">
              <BookItem icon={<IoIosAirplane />} label="Trip" />
              <BookItem icon={<MdFlight />} label="Flight" />
              <BookItem icon={<MdHotel />} label="Hotel" />
              <BookItem icon={<MdTrain />} label="Train" />
              <BookItem icon={<MdDirectionsBus />} label="Bus" />
            </div>

            {/* SCRAPBOOKS */}
            <SectionHeader title="Scrapbooks" showMore />
            <div className="horizontal-scroll">
              {scrapbooks.map((scrap) => (
                <article key={scrap.id} className="scrap-card">
                  <div className="scrap-image" />
                  <button className="scrap-heart">
                    <AiOutlineHeart />
                  </button>
                  <div className="scrap-info">
                    <h3>{scrap.city}</h3>
                    <p className="scrap-location">{scrap.country}</p>
                    <p className="scrap-price">{scrap.date}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* FRIENDS PREVIEW */}
            <SectionHeader title="Friends" />
            <div className="friend-scroll">
              {Array.from({ length: 8 }).map((_, i) => (
                <FriendPreview
                  key={i}
                  icon={
                    <img
                      src={PLACEHOLDER_AVATAR}
                      className="friend-avatar"
                      alt="friend"
                    />
                  }
                  name="User"
                />
              ))}
            </div>

            {/* BUCKET LIST */}
            <SectionHeader title="Bucket list" showMore />
            <div className="horizontal-scroll">
              {bucketList.map((place) => (
                <article key={place.id} className="bList-card">
                  <div className="bList-image" />
                  <div className="bList-info">
                    <h3>{place.title}</h3>
                    <p>{place.location}</p>
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* BOTTOM NAV */}
          <nav className="bottom-nav">
            <NavItem icon={<AiFillHome />} active />          {/* Home */}
            <NavItem icon={<FiMapPin />} />                   {/* Maps */}
            <NavItem icon={<MdEmergency />} sos />            {/* SOS */}
            <NavItem icon={<FiMessageCircle />} />            {/* Chatroom */}
            <NavItem icon={<MdCollectionsBookmark />} />      {/* Collections */}
          </nav>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, showMore }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {showMore && <button className="see-more">See more</button>}
    </div>
  );
}

function BookItem({ icon, label }) {
  return (
    <button className="book-item">
      <div className="book-icon">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

function FriendPreview({ icon, name }) {
  return (
    <button className="friend-item">
      <div className="friend-icon">{icon}</div>
      <span>{name}</span>
    </button>
  );
}

function NavItem({ icon, active, sos }) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""} ${sos ? "sos" : ""}`}
    >
      {icon}
    </button>
  );
}

export default App;
