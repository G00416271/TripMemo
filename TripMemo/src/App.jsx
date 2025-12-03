//App.jsx
import React, { useState } from "react";
import "./App.css";
import FileUpload from "./pages/fileUpload.jsx";
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
  FiArrowLeft,
} from "react-icons/fi";
import { AiOutlineSearch, AiOutlineHeart, AiFillHome } from "react-icons/ai";
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
import MapsPage from "./MapsPage";
import SOSPage from "./SOSPage";

// import editor components
import UploadFiles from "./uploadFiles.jsx";
import Create from "./pages/create.jsx";
import Memories from "./loadMemories.jsx";

const scrapbooks = [
  { id: 1, city: "Paris", date: "27/08/2025", country: "France" },
  { id: 2, city: "Brussels", date: "06/09/2025", country: "Belgium" },
  { id: 3, city: "Barcelona", date: "15/09/2025", country: "Spain" },
  { id: 4, city: "Amsterdam", date: "22/09/2025", country: "Netherlands" },
  { id: 5, city: "Rome", date: "01/10/2025", country: "Italy" },
];

const bucketList = [
  { id: 1, title: "Tokyo", location: "Japan" },
  { id: 2, title: "New York", location: "USA" },
  { id: 3, title: "Sydney", location: "Australia" },
  { id: 4, title: "Iceland", location: "Europe" },
  { id: 5, title: "Dubai", location: "UAE" },
];

const recentTrips = [
  { id: 1, destination: "London", days: 5, rating: 4.8, image: "gradient1" },
  { id: 2, destination: "Tokyo", days: 7, rating: 5.0, image: "gradient2" },
  { id: 3, destination: "Bali", days: 10, rating: 4.9, image: "gradient3" },
  { id: 4, destination: "New York", days: 4, rating: 4.7, image: "gradient4" },
];

const travelStats = [
  { label: "Countries Visited", value: "12", icon: "🌍" },
  { label: "Total Trips", value: "28", icon: "✈️" },
  { label: "Friends Met", value: "45", icon: "👥" },
  { label: "Photos Taken", value: "1.2K", icon: "📸" },
];

const PLACEHOLDER_AVATAR =
  "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [serverData, setServerData] = useState(null);
  const [currPage, setCurrPage] = useState("home");

  // Track onboarding step
  const [onboardingStep, setOnboardingStep] = useState(0);

  const handleNextOnboarding = () => setOnboardingStep((prev) => prev + 1);

  const handleSkipOnboarding = () => setOnboardingStep(3);

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

  // --- Main app after onboarding ---
  return (
    <div className="app-root">
      {/* HEADER - Show for home and maps */}
      {activeTab === "home" && (
        <header className="header">
          <div className="header-left">
            <img className="avatar" src={PLACEHOLDER_AVATAR} alt="Profile" />
            <div>
              <p className="hey-text">Hello, User 👋</p>
            </div>
          </div>

          {/* Hamburger button */}
          <button
            className="icon-pill"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
        </header>
      )}

      {/* MAPS HEADER - Only show on maps page */}
      {activeTab === "maps" && (
        <header className="header">
          <button
            className="icon-pill"
            onClick={() => setActiveTab("home")}
            aria-label="Back to home"
          >
            <FiArrowLeft />
          </button>
          <div
            className="header-left"
            style={{ flex: 1, justifyContent: "center" }}
          >
            <p className="hey-text">Map View</p>
          </div>
        </header>
      )}

      {/* SLIDE-OUT MENU */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* SEARCH - Only show on home */}
      {activeTab === "home" && (
        <section className="search-section">
          <div className="search-bar">
            <AiOutlineSearch className="search-icon" />
            <input type="text" placeholder="Find things you interested in" />
          </div>
        </section>
      )}

      {/* MAIN CONTENT */}
      <main
        className={`content ${activeTab === "maps" ? "content--maps" : ""}`}
      >
        {activeTab === "home" && (
          <>
            {/* Travel Stats Cards */}
            <SectionHeader title="Your Travel Journey" />
            <div className="stats-grid">
              {travelStats.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* "booking" / CTA section */}
            <SectionHeader title="Create Your Next Adventure..." />
            <div className="book-row">
              <BookItem icon={<IoIosAirplane />} label="Trip" />
              <BookItem icon={<MdFlight />} label="Flight" />
              <BookItem icon={<MdHotel />} label="Hotel" />
              <BookItem icon={<MdTrain />} label="Train" />
              <BookItem icon={<MdDirectionsBus />} label="Bus" />
            </div>

            {/* RECENT TRIPS */}
            <SectionHeader title="Recent Adventures" showMore />
            <div className="horizontal-scroll">
              {recentTrips.map((trip) => (
                <article key={trip.id} className="trip-card">
                  <div className={`trip-image trip-image--${trip.image}`} />
                  <div className="trip-info">
                    <h3>{trip.destination}</h3>
                    <div className="trip-meta">
                      <span className="trip-days">{trip.days} days</span>
                      <span className="trip-rating">⭐ {trip.rating}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* SCRAPBOOKS */}
            <SectionHeader title="Scrapbooks" showMore />
            <div className="horizontal-scroll">
              {scrapbooks.map((scrap) => (
                <article key={scrap.id} className="scrap-card">
                  <div className="scrap-image" />
                  <button className="scrap-heart" aria-label="Favorite">
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
            <SectionHeader title="Friends" showMore />
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

            {/* Travel Tips Section */}
            <SectionHeader title="Travel Tips" />
            <div className="tips-container">
              <TipCard
                emoji="💡"
                title="Pack Light"
                description="Bring only essentials for easier travel"
              />
              <TipCard
                emoji="📱"
                title="Stay Connected"
                description="Download offline maps before your trip"
              />
              <TipCard
                emoji="💰"
                title="Budget Smart"
                description="Set daily spending limits to track expenses"
              />
            </div>
          </>
        )}

        {activeTab === "maps" && <MapsPage />}
        {activeTab === "upload" && (
          <UploadFiles
            onUploadComplete={(data) => {
              setServerData(data);
              setActiveTab("canvas"); // or whatever page you want next
            }}
          />
        )}
        {activeTab === "create" && <Memories setActiveTab={setActiveTab} />}
        {activeTab === "canvas" && <Create serverData={serverData}/>}

        {activeTab === "sos" && (
          <SOSPage
            contacts={emergencyContacts}
            onSaveContacts={setEmergencyContacts}
          />
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav
        className="bottom-nav"
        role="navigation"
        aria-label="Main navigation"
      >
        <NavItem
          icon={<AiFillHome />}
          active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
          label="Home"
        />
        <NavItem
          icon={<FiMapPin />}
          active={activeTab === "maps"}
          onClick={() => setActiveTab("maps")}
          label="Maps"
        />
        <NavItem
          icon={<MdEmergency />}
          active={activeTab === "create"}
          onClick={() => setActiveTab("create")}
          label="Create"
        />
        <NavItem icon={<FiMessageCircle />} label="Chat" />
        <NavItem icon={<MdCollectionsBookmark />} label="Collections" />
      </nav>
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
    <button className="book-item" aria-label={label}>
      <div className="book-icon">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

function FriendPreview({ icon, name }) {
  return (
    <button className="friend-item" aria-label={name}>
      <div className="friend-icon">{icon}</div>
      <span>{name}</span>
    </button>
  );
}

function NavItem({ icon, active, sos, onClick, label }) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""} ${sos ? "sos" : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {icon}
    </button>
  );
}

function TipCard({ emoji, title, description }) {
  return (
    <div className="tip-card">
      <div className="tip-emoji">{emoji}</div>
      <h4 className="tip-title">{title}</h4>
      <p className="tip-description">{description}</p>
    </div>
  );
}

export default App;
