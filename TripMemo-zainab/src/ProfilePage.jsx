import React, { useState } from "react";
import { FiArrowLeft, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import "./ProfilePage.css";

const DICEBEAR_STYLES = [
  "adventurer",
  "avataaars",
  "big-ears",
  "bottts",
  "croodles",
  "fun-emoji",
  "icons",
  "lorelei",
  "micah",
  "miniavs",
  "notionists",
  "open-peeps",
  "personas",
  "pixel-art",
  "shapes",
];

function AvatarPicker({ currentAvatar, userId, onSave, onClose }) {
  const [selectedStyle, setSelectedStyle] = useState("adventurer");
  const [seed, setSeed] = useState(userId || "default");

  const getAvatarUrl = (style, s) =>
    `https://api.dicebear.com/7.x/${style}/svg?seed=${s}`;

  const handleSave = () => {
    onSave(getAvatarUrl(selectedStyle, seed));
  };

  return (
    <div className="avatar-picker-overlay">
      <div className="avatar-picker">
        <div className="avatar-picker-header">
          <h2>Choose Avatar</h2>
          <button onClick={onClose} className="avatar-picker-close">
            <FiX size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="avatar-picker-preview">
          <img
            src={getAvatarUrl(selectedStyle, seed)}
            alt="Avatar preview"
            className="avatar-picker-img"
          />
        </div>

        {/* Seed input */}
        <div className="avatar-picker-seed">
          <label>Customise seed</label>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value || "default")}
            placeholder="Type anything to change avatar"
          />
        </div>

        {/* Style picker */}
        <p className="avatar-picker-label">Choose a style</p>
        <div className="avatar-style-grid">
          {DICEBEAR_STYLES.map(style => (
            <button
              key={style}
              className={`avatar-style-btn ${selectedStyle === style ? "selected" : ""}`}
              onClick={() => setSelectedStyle(style)}
            >
              <img
                src={getAvatarUrl(style, seed)}
                alt={style}
                className="avatar-style-img"
              />
              <span>{style}</span>
            </button>
          ))}
        </div>

        <button className="avatar-picker-save" onClick={handleSave}>
          Save Avatar
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage({ user, userId, friends, onBack, onAvatarUpdate, onProfileUpdate }) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const avatarUrl = user?.avatar_url ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`;

  const handleSaveAvatar = async (url) => {
    try {
      await fetch(`http://https://tripmemo-11.onrender.com/users/${userId}/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
        credentials: "include"
      });
      onAvatarUpdate(url);
      setShowAvatarPicker(false);
    } catch (err) {
      console.error("Failed to save avatar:", err);
    }
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`http://https://tripmemo-11.onrender.com/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, username }),
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }
      onProfileUpdate({ firstName, lastName, username });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile");
    }
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button className="profile-back-btn" onClick={onBack}>
          <FiArrowLeft size={20} />
        </button>
        <h2>Profile</h2>
      </div>

      <div className="profile-content">
        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
          <button
            className="change-avatar-btn"
            onClick={() => setShowAvatarPicker(true)}
          >
            Change Avatar
          </button>
        </div>

        {/* Personal Information */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>Personal Information</h3>
            {!isEditing ? (
              <button
                className="profile-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <FiEdit2 size={14} /> Edit
              </button>
            ) : (
              <div className="profile-edit-actions">
                <button className="profile-save-btn" onClick={handleSaveProfile}>
                  <FiCheck size={14} /> Save
                </button>
                <button
                  className="profile-cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setError("");
                    setFirstName(user?.first_name || "");
                    setLastName(user?.last_name || "");
                    setUsername(user?.username || "");
                  }}
                >
                  <FiX size={14} /> Cancel
                </button>
              </div>
            )}
          </div>

          {error && <p className="profile-error">{error}</p>}
          {success && <p className="profile-success">{success}</p>}

          <div className="profile-field">
            <label>First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="profile-input"
              />
            ) : (
              <p>{user?.first_name || "—"}</p>
            )}
          </div>

          <div className="profile-field">
            <label>Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="profile-input"
              />
            ) : (
              <p>{user?.last_name || "—"}</p>
            )}
          </div>

          <div className="profile-field">
            <label>Username</label>
            {isEditing ? (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="profile-input"
              />
            ) : (
              <p>@{user?.username || "—"}</p>
            )}
          </div>

          <div className="profile-field">
            <label>Email</label>
            <p>{user?.email || "—"}</p>
          </div>
        </div>

        {/* Friend Count */}
        <div className="profile-section">
          <h3>Friends</h3>
          <div className="profile-friends-count">
            <span className="profile-count-number">{friends.length}</span>
            <span className="profile-count-label">Friends</span>
          </div>
        </div>

        {/* Account Info */}
        <div className="profile-section">
          <h3>Account Info</h3>
          <div className="profile-field">
            <label>Date Joined</label>
            <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric"
            }) : "—"}</p>
          </div>
        </div>
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          currentAvatar={avatarUrl}
          userId={userId}
          onSave={handleSaveAvatar}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}