import React, { useState, useEffect } from "react";

import "./App.css";
import FileUpload from "./pages/fileUpload.jsx";
import "./onboarding.css";
import "./fonts.css";

import ViewOnlyCanvas from "./ViewOnlyCanvas";
import LoginPage, { SignupPage } from "./LoginPage";
import "./Auth.css";

import {
  FiMenu,
  FiMapPin,
  FiCompass,
  FiMessageCircle,
  FiArrowLeft,
  FiUser,
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
import { FaTrophy } from "react-icons/fa";
import { IoCreate } from "react-icons/io5";

import SideMenu from "./SideMenu";
import MapsPage from "./MapsPage";
import { SOSPage } from "./SOSPage";
import "./SOSPage.css";

import FriendsPage from "./FriendsPage";
import FriendChat from "./FriendChat";
import ChatRoom from "./ChatRoom";
import "./ChatRoom.css";

import Create from "./pages/Create.jsx";
import Challenges from "./pages/challenges.jsx";
import Memories from "./loadMemories.jsx";
import UploadFiles from "./uploadFiles.jsx";

import BucketListsPage from "./BucketListsPage";
import BucketListEditor from "./BucketListEditor";
import BucketListModal from "./BucketListModal";
import ProfilePage from "./ProfilePage";
import GroupChat from "./GroupChat";
import CanvasThumbnail from "./CanvasThumbnail";
import ExplorePage from "./ExplorePage";
import { useAuth0 } from "@auth0/auth0-react"; //auth0 added 


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
  const [selectedMemoryId, setSelectedMemoryId] = useState(null);
  const [SelectedMemoryName, setSelectedMemoryName] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [emergencyMessages, setEmergencyMessages] = useState([]);
  const [serverData, setServerData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userName, setUserName] = useState("User");

  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const [sosContacts, setSosContacts] = useState([]);
  const [emergencyLocation, setEmergencyLocation] = useState(null);

  const [bucketLists, setBucketLists] = useState([]);
  const [activeBucketList, setActiveBucketList] = useState(null);
  const [showBucketModal, setShowBucketModal] = useState(false);

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // new — scroll state for liquid glass header effect
  // const [scrolled, setScrolled] = useState(false);

  // Real scrapbooks (memories) for the home screen
  const [scrapbooks, setScrapbooks] = useState([]);

  //new
  const { user: auth0User, isAuthenticated: auth0IsAuthenticated } = useAuth0();

  const [userLocation, setUserLocation] = useState("Getting location..."); // new

  const [weather, setWeather] = useState(null); // new


  // new — get weather emoji based on condition
const getWeatherEmoji = (condition) => {
  const map = {
    Clear: "☀️",
    Clouds: "⛅",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️",
  };
  return map[condition] || "🌡️";
};


const [bucketThumbnails, setBucketThumbnails] = useState({}); // new
const [selectedBucketId, setSelectedBucketId] = useState(null); // new
const bucketFileRef = React.useRef(null); // new



// const [weather, setWeather] = useState({
//   temp: 12,
//   feels: 9,
//   condition: "Clouds",
//   description: "overcast clouds",
//   city: "Galway",
//   humidity: 80,
//   wind: 5,
// }); // new — temporary hardcoded weather for testing

  // new — scroll listener for liquid glass header
  // useEffect(() => {
  //   const handleScroll = () => {
  //     setScrolled(window.scrollY > 10);
  //   };
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  useEffect(() => {
    fetch("https://tripmemo-11.onrender.com/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (!user) return;
        setUserName(user.username);
        setUserId(user.user_id);
        setUserProfile(user);
        setIsAuthenticated(true);
        fetch(`https://tripmemo-11.onrender.com/users/${user.user_id}/friends`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => setFriends(data));
        fetch(`https://tripmemo-11.onrender.com/sos-contacts/${user.user_id}`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => setSosContacts(data));
        fetch(`https://tripmemo-11.onrender.com/bucket-lists/${user.user_id}`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => setBucketLists(data));
        fetch(`https://tripmemo-11.onrender.com/saved-places/${user.user_id}`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => setSavedPlaces(data));
        fetch(`https://tripmemo-11.onrender.com/groups/user/${user.user_id}`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => setGroups(data));

        // Fetch real memories for scrapbooks section
        const fd = new FormData();
        fd.append("action", "fetch");
        fd.append("user_id", user.user_id);
        fetch("https://tripmemo-11.onrender.com/memories", { method: "POST", body: fd })
          .then((res) => res.json())
          .then((data) => setScrapbooks(data))
          .catch((err) => console.error("Failed to fetch scrapbooks:", err));
      });
  }, []);

  // new — get user's real location for hero card
useEffect(() => {
  if (!navigator.geolocation) {
    setUserLocation("Location unavailable");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=fb5c60a926f74dcfbbce6e9448b1e85d&limit=1`
        );
        const data = await res.json();
        const result = data.results[0]?.components;
        if (result) {
          const city = result.city || result.town || result.village || result.county || "";
          const country = result.country || "";
          setUserLocation(`${city}, ${country}`);
        } else {
          setUserLocation("Location unavailable");
        }
      } catch {
        setUserLocation("Location unavailable");
      }
    },
    () => setUserLocation("Location unavailable")
  );
}, []);



// new — fetch weather based on user's location
useEffect(() => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=e0b90cb0dc4aeceddc9054c435b88031&units=metric`
      );
      const data = await res.json();
      setWeather({
        temp: Math.round(data.main.temp),
        feels: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        city: data.name,
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed),
      });
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    }
  });
}, []);

  //new
  // useEffect(() => {
  //   if (auth0IsAuthenticated && auth0User && !isAuthenticated) {
  //     // Register or login the Google user in your backend
  //     fetch("https://tripmemo-11.onrender.com/auth/google", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         email: auth0User.email,
  //         firstName: auth0User.given_name || auth0User.nickname,
  //         lastName: auth0User.family_name || "",
  //         avatar: auth0User.picture
  //       }),
  //       credentials: "include"
  //     })
  //       .then(res => res.json())
  //       .then(data => {
  //         if (data.user_id) {
  //           setUserId(data.user_id);
  //           setUserName(data.username);
  //           setAvatarUrl(data.avatar_url || auth0User.picture);
  //           setUserProfile(data);
  //           setIsAuthenticated(true);
  //           fetchFriends(data.user_id);
  //           fetchSentRequests(data.user_id);
  //         }
  //       })
  //       .catch(err => console.error("Google auth failed:", err));
  //   }
  // }, [auth0IsAuthenticated, auth0User]);

  const shareMatch = window.location.pathname.match(/^\/share\/(\d+)$/);
  if (shareMatch) {
    return <ViewOnlyCanvas memoryId={Number(shareMatch[1])} />;
  }

  if (!isAuthenticated) {
    if (showSignup) {
      return (
        <div style={{ height: "100dvh", overflowY: "auto" }}>
          <SignupPage
            onSignup={(name) => {
              setFriends([]);
              setSentRequests([]);
              setSearchResults([]);
              setSearchQuery("");
              setSelectedFriend(null);
              setUserName(name);
              setIsAuthenticated(true);
            }}
            onSwitchToLogin={() => setShowSignup(false)}
          />
        </div>
      );
    }
    return (
      <div style={{ height: "100dvh", overflowY: "auto" }}>
        <LoginPage
          onLogin={(name, id) => {
            setFriends([]);
            setSosContacts([]);
            setSentRequests([]);
            setSearchResults([]);
            setSearchQuery("");
            setSelectedFriend(null);
            setSavedPlaces([]);
            setBucketLists([]);
            setAvatarUrl(null);
            setUserProfile(null);
            setScrapbooks([]);
            setUserName(name);
            setUserId(id);
            setIsAuthenticated(true);
          }}
          onSwitchToSignup={() => setShowSignup(true)}
        />
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch("https://tripmemo-11.onrender.com/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
    setUserName("");
    setUserId(null);
    setFriends([]);
    setSosContacts([]);
    setSavedPlaces([]);
    setSentRequests([]);
    setSearchResults([]);
    setSearchQuery("");
    setSelectedFriend(null);
    setShowSignup(false);
    setGroups([]);
    setScrapbooks([]);
  };

  const fetchFriends = async (id) => {
    try {
      const res = await fetch(`https://tripmemo-11.onrender.com/users/${id}/friends`, {
        credentials: "include",
      });
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  };

  const addSosContact = async (friend) => {
    try {
      await fetch("https://tripmemo-11.onrender.com/sos-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId: friend.user_id }),
        credentials: "include",
      });
      setSosContacts((prev) => [...prev, friend]);
    } catch (err) {
      console.error("Failed to add SOS contact:", err);
    }
  };

  const removeSosContact = async (friendId) => {
    try {
      await fetch(`https://tripmemo-11.onrender.com/sos-contacts/${userId}/${friendId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setSosContacts((prev) => prev.filter((c) => c.user_id !== friendId));
    } catch (err) {
      console.error("Failed to remove SOS contact:", err);
    }
  };

  const addSavedPlace = async (name, latitude, longitude) => {
    try {
      const res = await fetch("https://tripmemo-11.onrender.com/saved-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, latitude, longitude }),
        credentials: "include",
      });
      const newPlace = await res.json();
      setSavedPlaces((prev) => [...prev, newPlace]);
    } catch (err) {
      console.error("Failed to save place:", err);
    }
  };

  const removeSavedPlace = async (placeId) => {
    try {
      await fetch(`https://tripmemo-11.onrender.com/saved-places/${placeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setSavedPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch (err) {
      console.error("Failed to remove place:", err);
    }
  };

  const createBucketList = async (title) => {
    try {
      const res = await fetch("https://tripmemo-11.onrender.com/bucket-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title }),
        credentials: "include",
      });
      const newList = await res.json();
      setBucketLists((prev) => [newList, ...prev]);
      return newList;
    } catch (err) {
      console.error("Failed to create bucket list:", err);
    }
  };

  const deleteBucketList = async (id) => {
    try {
      await fetch(`https://tripmemo-11.onrender.com/bucket-lists/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setBucketLists((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed to delete bucket list:", err);
    }
  };

  const renameBucketList = async (id, title) => {
    try {
      await fetch(`https://tripmemo-11.onrender.com/bucket-lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        credentials: "include",
      });
      setBucketLists((prev) =>
        prev.map((b) => (b.id === id ? { ...b, title } : b)),
      );
    } catch (err) {
      console.error("Failed to rename bucket list:", err);
    }
  };

  const openBucketList = async (list) => {
    try {
      await fetch(`https://tripmemo-11.onrender.com/bucket-lists/${list.id}/accessed`, {
        method: "PATCH",
        credentials: "include",
      });
      setBucketLists((prev) => {
        const updated = prev.map((b) =>
          b.id === list.id
            ? { ...b, last_accessed: new Date().toISOString() }
            : b,
        );
        return updated.sort(
          (a, b) => new Date(b.last_accessed) - new Date(a.last_accessed),
        );
      });
    } catch (err) {
      console.error("Failed to update last accessed:", err);
    }
    setActiveBucketList(list);
    setActiveTab("bucketlisteditor");
  };

  const createGroup = async (name, memberIds) => {
    try {
      const res = await fetch("https://tripmemo-11.onrender.com/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, createdBy: userId, memberIds }),
        credentials: "include",
      });
      const newGroup = await res.json();
      setGroups((prev) => [newGroup, ...prev]);
      setSelectedGroup(newGroup);
      setActiveTab("groupchat");
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  // new
  const leaveGroup = async (groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setActiveTab("friends");
    try {
      const res = await fetch(`https://tripmemo-11.onrender.com/groups/user/${userId}`, {
        credentials: "include"
      });
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error("Failed to refresh groups:", err);
    }
  };
  // const leaveGroup = (groupId) => {
  //   setGroups((prev) => prev.filter((g) => g.id !== groupId));
  //   setActiveTab("friends");
  // };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://tripmemo-11.onrender.com/users/search?query=${query}`,
        { credentials: "include" },
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]); // fallback
    }
  };

  const handleAddFriend = async (targetUserId) => {
    if (!userId) {
      alert("You must be logged in to add friends");
      return;
    }
    try {
      await fetch(
        `https://tripmemo-11.onrender.com/users/friend-request/${targetUserId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: userId }),
          credentials: "include",
        },
      );
      setSentRequests((prev) => [...prev, targetUserId]);
    } catch (err) {
      console.error("Failed to send request:", err);
    }
  };

  // Navigate into a scrapbook (memory) from the home screen card
  const handleScrapbookClick = async (memory) => {
    setUploadedFiles([]);
    setSelectedMemoryId(memory.memory_id);
    setSelectedMemoryName(memory.title);
    try {
      const res = await fetch(
        `https://tripmemo-11.onrender.com/api/canvas/load?memoryId=${memory.memory_id}`,
      );
      if (!res.ok) throw new Error("Load failed");
      const data = await res.json();
      setActiveTab(data.items?.length > 0 ? "canvas" : "upload");
    } catch (err) {
      console.error(err);
      setActiveTab("upload");
    }
  };

  return (
    <div className="app-root">
      {/* Original header — restored to original style */}
      {/* {activeTab === "home" && (
        <header className="header">
          <div className="header-left">
            <img
              className="avatar"
              src={
                avatarUrl ||
                `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`
              }
              alt="Profile"
            />
            <div>
              <p className="hey-text">Hello, {userName} 👋</p>
            </div>
          </div>
          <button
            className="icon-pill"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
        </header>
      )}

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
      )} */}


        {activeTab === "home" && (
  <header className="header">
    <div className="header-left">
      <img
        className="avatar"
        src={
          avatarUrl ||
          `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`
        }
        alt="Profile"
      />
      <div>
        <p className="hey-text">Hello, {userName} 👋</p>
      </div>
    </div>
    <button
      className="icon-pill"
      onClick={() => setIsMenuOpen(true)}
      aria-label="Open menu"
    >
      <FiMenu />
    </button>
    {/* new — search bar moved into header */}
    <div className="header-search">
      <AiOutlineSearch className="search-icon" />
      <input
        type="text"
        placeholder="Search for friends"
        value={searchQuery}
        onChange={handleSearch}
      />
      {searchQuery && (
        <button
          className="search-clear-btn"
          onClick={() => { setSearchQuery(""); setSearchResults([]); }}
        >
          ×
        </button>
      )}
    </div>
    {searchResults
      .filter((user) => !friends.some((f) => f.user_id === user.user_id))
      .map((user) => (
        <div key={user.user_id} className="search-result-card">
          <div className="search-result-info" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.user_id}`}
              alt={user.first_name}
              className="friend-avatar"
            />
            <p className="search-result-name">{user.first_name} {user.last_name}</p>
          </div>
          <button
            className={`add-friend-btn ${sentRequests.includes(user.user_id) ? "pending" : ""}`}
            onClick={() => handleAddFriend(user.user_id)}
            disabled={sentRequests.includes(user.user_id)}
          >
            {sentRequests.includes(user.user_id) ? "Pending" : "Add"}
          </button>
        </div>
      ))}
  </header>
)}

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={handleLogout}
        onProfile={() => {
          setIsMenuOpen(false);
          setActiveTab("profile");
        }}
        avatarUrl={
          avatarUrl ||
          `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`
        }
        userName={userName}
        userEmail={userProfile?.email || ""}
      />

      {/* new — search section moved inside home tab content below */}

      <main
        className={`content ${activeTab === "maps" ? "content--maps" : ""}`}
      >
        {/* new — friends page with groups prop */}
        {activeTab === "friends" && (
          <FriendsPage
            userId={userId}
            friends={friends}
            groups={groups} // new
            onAccept={() => fetchFriends(userId)}
            onOpenChat={(friend) => {
              setSelectedFriend(friend);
              setActiveTab("friendchat");
            }}
            onOpenGroup={async (group, name, memberIds) => {
              if (group) {
                setSelectedGroup(group);
                setActiveTab("groupchat");
              } else {
                await createGroup(name, memberIds);
              }
            }}
            onLeaveGroup={leaveGroup}
          />
        )}

        {/* {activeTab === "friends" && (
          <FriendsPage
            userId={userId}
            friends={friends}
            onAccept={() => fetchFriends(userId)}
            onOpenChat={(friend) => {
              setSelectedFriend(friend);
              setActiveTab("friendchat");
            }}
            onOpenGroup={async (group, name, memberIds) => {
              if (group) {
                setSelectedGroup(group);
                setActiveTab("groupchat");
              } else {
                await createGroup(name, memberIds);
              }
            }}
            onLeaveGroup={leaveGroup}
          />
        )} */}

        {activeTab === "friendchat" && selectedFriend && (
          <FriendChat
            friend={selectedFriend}
            userId={userId}
            onBack={() => setActiveTab("friends")}
            onViewEmergencyLocation={(location) => {
              setEmergencyLocation(location);
              setActiveTab("maps");
            }}
          />
        )}

        {activeTab === "groupchat" && selectedGroup && (
          <GroupChat
            group={selectedGroup}
            userId={userId}
            userName={userName}
            friends={friends}
            onBack={() => setActiveTab("friends")}
            onLeave={leaveGroup}
          />
        )}

        {activeTab === "home" && (
          <>
            {/* new — hero section */}
            <div className="hero-section">
              <div className="hero-gradient" />
              <div className="hero-content">
                <h1 className="hero-title">Your Next<br />Adventure<br />Starts Here</h1>
                <p className="hero-subtitle">Capture memories, explore the world</p>
                <div className="hero-buttons">
                  <button className="hero-btn hero-btn--primary" onClick={() => setActiveTab("create")}>
                    Create Trip ✈️
                  </button>
                  <button className="hero-btn hero-btn--secondary" onClick={() => setActiveTab("explore")}>
                    Explore
                  </button>
                </div>
                <div className="hero-stats">
                  <div className="hero-stat">
                    <span className="hero-stat-value">{friends.length}</span>
                    <span className="hero-stat-label">Friends</span>
                  </div>
                  <div className="hero-stat-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat-value">{scrapbooks.length}</span>
                    <span className="hero-stat-label">Scrapbooks</span>
                  </div>
                  <div className="hero-stat-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat-value">{bucketLists.length}</span>
                    <span className="hero-stat-label">Bucket Lists</span>
                  </div>
                </div>
              </div>
              {/* new — floating glass cards */}
              <div className="hero-card hero-card--1"><span>📍</span><p>{userLocation}</p></div>
              <div className="hero-card hero-card--2"><span>✈️</span><p>Next trip?</p></div>
              <div className="hero-card hero-card--3"><span>📸</span><p>{scrapbooks.length} memories</p></div>
            </div>

            {/*new — search section moved here below hero*/}
            {/* <section className="search-section">
              <div className="search-bar">
                <AiOutlineSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search for friends" //new
                  value={searchQuery}
                  onChange={handleSearch}
                />
                {searchQuery && (
                  <button
                    className="search-clear-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              {searchResults
                .filter((user) => !friends.some((f) => f.user_id === user.user_id))
                .map((user) => (
                  <div key={user.user_id} className="search-result-card">
                    <div
                      className="search-result-info" 
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <img
                        src={
                          user.avatar_url ||
                          `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.user_id}`
                        }
                        alt={user.first_name}
                        className="friend-avatar"
                      />
                      <p className="search-result-name">
                        {user.first_name} {user.last_name}
                      </p>
                    </div>
                    <button
                      className={`add-friend-btn ${sentRequests.includes(user.user_id) ? "pending" : ""}`}
                      onClick={() => handleAddFriend(user.user_id)}
                      disabled={sentRequests.includes(user.user_id)}
                    >
                      {sentRequests.includes(user.user_id) ? "Pending" : "Add"}
                    </button>
                  </div>
                ))}
            </section> */}


          {/* new — weather widget */}
{weather && (
  <div className="weather-card">
    <div className="weather-left">
      <span className="weather-emoji">{getWeatherEmoji(weather.condition)}</span>
      <div>
        <p className="weather-city">{weather.city}</p>
        <p className="weather-desc">{weather.description}</p>
      </div>
    </div>
    <div className="weather-right">
      <p className="weather-temp">{weather.temp}°C</p>
      <p className="weather-feels">Feels like {weather.feels}°C</p>
      <p className="weather-details">💧 {weather.humidity}% · 💨 {weather.wind} m/s</p>
    </div>
  </div>
)}

            {/* <SectionHeader title="Your Travel Journey" />
            <div className="stats-grid">
              {travelStats.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div> */}

            <SectionHeader title="Create Your Next Adventure..." />
            <div className="book-row">
  <BookItem icon={<IoIosAirplane />} label="Trip" href="https://www.tripadvisor.com" />
  <BookItem icon={<MdFlight />} label="Flight" href="https://www.google.com/flights" />
  <BookItem icon={<MdHotel />} label="Hotel" href="https://www.booking.com" />
  <BookItem icon={<MdTrain />} label="Train" href="https://www.trainline.com" />
  <BookItem icon={<MdDirectionsBus />} label="Bus" href="https://www.flixbus.com" />
</div>
            {/* <div className="book-row">
              <BookItem icon={<IoIosAirplane />} label="Trip" />
              <BookItem icon={<MdFlight />} label="Flight" />
              <BookItem icon={<MdHotel />} label="Hotel" />
              <BookItem icon={<MdTrain />} label="Train" />
              <BookItem icon={<MdDirectionsBus />} label="Bus" />
            </div> */}
            
              {/* new: comment this out, hardcoded */}
            {/* <SectionHeader title="Recent Adventures" showMore />
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
            </div> */}

            {/* ── Scrapbooks: real memories ── */}
            <SectionHeader
              title="Scrapbooks"
              showMore
              onSeeMore={() => setActiveTab("create")}
            />
            <div className="horizontal-scroll">
              {/* "New scrapbook" add button */}
              <button
                className="scrap-add-btn"
                onClick={() => setActiveTab("create")}
                aria-label="Create new scrapbook"
              >
                <div className="scrap-add-icon">+</div>
                <p>New Scrapbook</p>
              </button>

              {scrapbooks.length === 0 ? (
                <p
                  style={{
                    color: "#aaa",
                    fontSize: "13px",
                    alignSelf: "center",
                    paddingRight: 16,
                  }}
                >
                  No scrapbooks yet — create one!
                </p>
              ) : (
                scrapbooks.map((memory) => (
                  <article
                    key={memory.memory_id}
                    className="scrap-card"
                    onClick={() => handleScrapbookClick(memory)}
                    style={{ cursor: "pointer", minWidth: 180, maxWidth: 220 }}
                  >
                    {/* Live canvas thumbnail instead of placeholder gradient */}
                    <div
                      className="scrap-image"
                      style={{ padding: 0, overflow: "hidden" }}
                    >
                      <CanvasThumbnail
                        memoryId={memory.memory_id}
                        memoryTitle={memory.title}
                        width={220}
                        height={108}
                        showShareBtn={false}
                        showExportBtn={false}
                      />
                    </div>
                    <div className="scrap-info">
                      <h3>{memory.title}</h3>
                      <p className="scrap-location">
                        {new Date(memory.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>

            <SectionHeader title="Friends" showMore />
            <div className="friend-scroll">
              {friends.length === 0 ? (
                <p
                  style={{ color: "#aaa", fontSize: "13px", padding: "0 16px" }}
                >
                  No friends yet — search for people above!
                </p>
              ) : (
                friends.map((friend) => (
                  <FriendPreview
                    key={friend.user_id}
                    icon={
                      <img
                        src={
                          friend.avatar_url ||
                          `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`
                        }
                        className="friend-avatar"
                        alt={friend.username}
                      />
                    }
                    name={friend.first_name}
                    onClick={() => {
                      setSelectedFriend(friend);
                      setActiveTab("friendchat");
                    }}
                  />
                ))
              )}
            </div>

            <SectionHeader
              title="Bucket List"
              showMore
              onTitleClick={() => setActiveTab("bucketlists")}
            />
            <div className="horizontal-scroll">
              <button
                className="bList-add-btn"
                onClick={() => setShowBucketModal(true)}
              >
                <div className="bList-add-icon">+</div>
                <p>New List</p>
              </button>
              {/* {bucketLists.map((list) => (
                <article
                  key={list.id}
                  className="bList-card"
                  onClick={() => openBucketList(list)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="bList-image" />
                  <div className="bList-info">
                    <h3>{list.title}</h3>
                    <p>{new Date(list.created_at).toLocaleDateString()}</p>
                  </div>
                </article>
              ))} */}
              {/* new — hidden file input for bucket list cover */}
<input
  ref={bucketFileRef}
  type="file"
  accept="image/*"
  style={{ display: "none" }}
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBucketThumbnails(prev => ({ ...prev, [selectedBucketId]: ev.target.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }}
/>

{bucketLists.map((list) => (
  <article
    key={list.id}
    className="bList-card"
    onClick={() => openBucketList(list)}
    style={{ cursor: "pointer", position: "relative" }}
  >
    <div
      className="bList-image"
      style={bucketThumbnails[list.id] ? {
        backgroundImage: `url(${bucketThumbnails[list.id]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } : {}}
    />
    {/* new — gear button to change cover */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedBucketId(list.id);
        bucketFileRef.current.click();
      }}
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        background: "rgba(0,0,0,0.4)",
        border: "none",
        borderRadius: "50%",
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "white",
        fontSize: "14px"
      }}
    >
      ⚙️
    </button>
    <div className="bList-info">
      <h3>{list.title}</h3>
      <p>{new Date(list.created_at).toLocaleDateString()}</p>
    </div>
  </article>
))}
            </div>

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

        {activeTab === "maps" && (
          <MapsPage
            emergencyLocation={emergencyLocation}
            onEmergencyLocationViewed={() => setEmergencyLocation(null)}
            savedPlaces={savedPlaces}
            onAddSavedPlace={addSavedPlace}
            onRemoveSavedPlace={removeSavedPlace}
          />
        )}

        {activeTab === "upload" && (
          <FileUpload
            memoryId={selectedMemoryId}
            memoryName={SelectedMemoryName}
            onFilesReady={(files) => setUploadedFiles(files)}
            setActiveTab={setActiveTab}
            onUploadComplete={(data) => {
              setServerData(data);
              setActiveTab("canvas");
            }}
          />
        )}

        {activeTab === "create" && (
          <Memories
            setActiveTab={setActiveTab}
            setSelectedMemoryId={setSelectedMemoryId}
            setSelectedMemoryName={setSelectedMemoryName}
            setUploadedFiles={setUploadedFiles}
            userId={userId}
            avatarUrl={avatarUrl}
          />
        )}

        {activeTab === "sos" && (
          <SOSPage
            userId={userId}
            friends={friends}
            sosContacts={sosContacts}
            onAddSosContact={addSosContact}
            onRemoveSosContact={removeSosContact}
            onSendMessage={(message) =>
              setEmergencyMessages((prev) => [...prev, message])
            }
          />
        )}

        {activeTab === "canvas" && (
          <Create
            memoryId={selectedMemoryId}
            memoryName={SelectedMemoryName}
            serverData={serverData}
            uploadedFiles={uploadedFiles}
            setActiveTab={setActiveTab}
            setUploadedFiles={setUploadedFiles}
            avatarUrl={avatarUrl}
          />
        )}

        {activeTab === "Challenges" && (
          <Challenges
            memoryId={selectedMemoryId}
            memoryName={SelectedMemoryName}
            serverData={serverData}
            uploadedFiles={uploadedFiles}
            setActiveTab={setActiveTab}
            setUploadedFiles={setUploadedFiles}
          />
        )}

        {activeTab === "chatroom" && (
          <ChatRoom
            emergencyContacts={emergencyContacts}
            emergencyMessages={emergencyMessages}
          />
        )}

        {activeTab === "bucketlists" && (
          <BucketListsPage
            bucketLists={bucketLists}
            onOpen={(list) => openBucketList(list)}
            onCreate={async (title) => {
              const newList = await createBucketList(title);
              if (newList) openBucketList(newList);
            }}
            onDelete={deleteBucketList}
            onRename={renameBucketList}
            onBack={() => setActiveTab("home")}
          />
        )}

        {activeTab === "explore" && (
          <ExplorePage
            setActiveTab={setActiveTab}
            onOpenMemory={(memory) => {
              window.open(`/share/${memory.memory_id}`, "_blank");
            }}
          />
        )}

        {activeTab === "bucketlisteditor" && activeBucketList && (
          <BucketListEditor
            bucketList={activeBucketList}
            onBack={() => setActiveTab("bucketlists")}
          />
        )}

        {activeTab === "profile" && (
          <ProfilePage
            user={userProfile}
            userId={userId}
            friends={friends}
            onBack={() => setActiveTab("home")}
            onAvatarUpdate={(url) => {
              setAvatarUrl(url);
              setUserProfile((prev) => ({ ...prev, avatar_url: url }));
            }}
            onProfileUpdate={(updated) => {
              setUserName(updated.username);
              setUserProfile((prev) => ({
                ...prev,
                first_name: updated.firstName,
                last_name: updated.lastName,
                username: updated.username,
              }));
            }}
          />
        )}
      </main>

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
          icon={<FiCompass />}
          active={activeTab === "explore"}
          onClick={() => setActiveTab("explore")}
          label="Explore"
        />
        <NavItem
          icon={<IoCreate />}
          active={activeTab === "create"}
          onClick={() => setActiveTab("create")}
          label="Create"
        />
        <NavItem
          icon={<MdEmergency />}
          active={activeTab === "sos"}
          onClick={() => setActiveTab("sos")}
          label="SOS"
        />
        {/* <NavItem
          icon={<FiMessageCircle />}
          active={activeTab === "chatroom"}
          onClick={() => setActiveTab("chatroom")}
          label="Chat"
        /> */}
        <NavItem
          icon={<FaTrophy />}
          active={activeTab === "Challenges"}
          onClick={() => setActiveTab("Challenges")}
          label="Challenges"
        />
        <NavItem
          icon={<FiUser />}
          active={activeTab === "friends"}
          onClick={() => setActiveTab("friends")}
          label="Friends"
        />
      </nav>

      <BucketListModal
        isOpen={showBucketModal}
        onClose={() => setShowBucketModal(false)}
        onSave={async (title) => {
          const newList = await createBucketList(title);
          setShowBucketModal(false);
          if (newList) openBucketList(newList);
        }}
      />
    </div>
  );
}

function SectionHeader({ title, showMore, onTitleClick, onSeeMore }) {
  return (
    <div className="section-header">
      <h2
        onClick={onTitleClick}
        style={onTitleClick ? { cursor: "pointer" } : {}}
      >
        {title}
      </h2>
      {/* {showMore && (
        <button className="see-more" onClick={onSeeMore}>
          See more
        </button>
      )} */}
    </div>
  );
}

//new
function BookItem({ icon, label, href }) {
  return (
    <button className="book-item" aria-label={label} onClick={() => window.open(href, "_blank")}>
      <div className="book-icon">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

// function BookItem({ icon, label }) {
//   return (
//     <button className="book-item" aria-label={label}>
//       <div className="book-icon">{icon}</div>
//       <span>{label}</span>
//     </button>
//   );
// }

function FriendPreview({ icon, name, onClick }) {
  return (
    <button className="friend-item" aria-label={name} onClick={onClick}>
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