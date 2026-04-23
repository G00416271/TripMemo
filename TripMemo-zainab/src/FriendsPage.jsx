import React, { useState, useEffect } from "react";
import { FiUsers, FiChevronRight, FiX, FiCheck, FiUserPlus, FiSearch, FiMessageCircle } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { AiOutlineSearch } from "react-icons/ai";
import groupAvatar from "./assets/gc_avatar.png";

export default function FriendsPage({ userId, friends, onOpenChat, onAccept, onOpenGroup, groups = [], onLeaveGroup }) {
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // new
  const [showDropdown, setShowDropdown] = useState(null);
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);
  const [selectedUnfriend, setSelectedUnfriend] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetchRequests();
  }, [userId]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`https://tripmemo-11.onrender.com/users/${userId}/friend-requests`, { credentials: "include" });
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`https://tripmemo-11.onrender.com/users/search?query=${query}`, { credentials: "include" });
      const data = await res.json();
      // Handle both array response and wrapped { results: [...] } shape
      setSearchResults(Array.isArray(data) ? data : (data.results ?? data.users ?? []));
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    if (!userId) return;
    try {
      await fetch(`https://tripmemo-11.onrender.com/users/friend-request/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: userId }),
        credentials: "include"
      });
      setSentRequests(prev => [...prev, targetUserId]);
    } catch (err) {
      console.error("Failed to send request:", err);
    }
  };

  const handleAccept = async (senderId) => {
    try {
      await fetch(`https://tripmemo-11.onrender.com/users/friend-request/${senderId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        credentials: "include"
      });
      setRequests(prev => prev.filter(r => r.user_id !== senderId));
      onAccept();
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const handleDecline = async (senderId) => {
    try {
      await fetch(`https://tripmemo-11.onrender.com/users/friend-request/${senderId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        credentials: "include"
      });
      setRequests(prev => prev.filter(r => r.user_id !== senderId));
    } catch (err) {
      console.error("Failed to decline request:", err);
    }
  };

  // new
  const handleUnfriend = async () => {
  try {
    await fetch(`https://tripmemo-11.onrender.com/users/${userId}/friends/${selectedUnfriend.user_id}`, {
      method: "DELETE",
      credentials: "include"
    });
    setShowUnfriendModal(false);
    setSelectedUnfriend(null);
    setShowDropdown(null);
    onAccept(); // refetches friends list
  } catch (err) {
    console.error("Failed to unfriend:", err);
  }
};

  return (
    <div className="friends-page">

      {/* ── Search Section ── */}
      <section className="friends-search-section">
        <div className="friends-search-bar">
          <AiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for friends..."
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => { setSearchQuery(""); setSearchResults([]); }}>×</button>
          )}
        </div>
        {(Array.isArray(searchResults) ? searchResults : [])
          .filter(user => !friends.some(f => f.user_id === user.user_id))
          .map(user => (
            <div key={user.user_id} className="search-result-card">
              <div className="search-result-info">
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
          ))
        }
      </section>

      {/* ── Header ── */}
      <div className="friends-header">
        <div>
          <h2>Friends</h2>
          <p className="friends-subheading">{friends.length} connection{friends.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="friends-header-actions">
          {/* New Group */}
          <button className="fh-btn fh-btn--ghost" onClick={() => setShowNewGroup(true)} title="New group chat">
            <HiOutlineUserGroup size={18} />
          </button>
          {/* Friend Requests */}
          <button className="fh-btn fh-btn--ghost" onClick={() => setShowRequests(true)} title="Friend requests">
            <FiUsers size={17} />
            {requests.length > 0 && <span className="requests-badge">{requests.length}</span>}
          </button>
        </div>
      </div>

      {/* ── Friends List ── */}
      {friends.length === 0 ? (
        <div className="no-friends">
          <div className="no-friends-icon">👋</div>
          <p className="no-friends-title">No friends yet</p>
          <small>Use the search bar above to find people</small>
          <button
            className="fh-btn fh-btn--primary"
            style={{ marginTop: 16 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <FiSearch size={14} />
            <span>Search for friends</span>
          </button>
        </div>
        ) : (
          // new
        <div className="friends-list">
          {friends.map((friend, i) => (
            <div key={friend.user_id} style={{ position: "relative" }}>
              <button
                className="friend-row"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => onOpenChat(friend)}
              >
                <div className="friend-row-avatar-wrap">
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`}
                    alt={friend.username}
                    className="friend-row-avatar"
                  />
                  <div className="friend-row-online" />
                </div>
                <div className="friend-row-info">
                  <p className="friend-row-name">{friend.first_name} {friend.last_name}</p>
                  <p className="friend-row-username">@{friend.username}</p>
                </div>
                <div className="friend-row-chat-icon">
                  <FiMessageCircle size={16} />
                </div>
              </button>
              {/* <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(showDropdown === friend.user_id ? null : friend.user_id);
                }}
                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "18px", color: "#888" }}
              >
                ⋮
              </button> */}

              {/* new */}
              <button
  onClick={(e) => {
    e.stopPropagation();
    setShowDropdown(showDropdown === friend.user_id ? null : friend.user_id);
  }}
  style={{ position: "absolute", right: "0px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "18px", color: "#888", zIndex: 10 }}
>
  ⋮
</button>
              {showDropdown === friend.user_id && (
  <div style={{ position: "absolute", right: "0px", top: "60%", background: "white", border: "1px solid #eee", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "120px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUnfriend(friend);
                      setShowUnfriendModal(true);
                      setShowDropdown(null);
                    }}
                    style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", color: "#ff4444", fontSize: "14px" }}
                  >
                    Unfriend
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showUnfriendModal && selectedUnfriend && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "90%", maxWidth: "360px" }}>
            <h3 style={{ margin: "0 0 12px" }}>Unfriend</h3>
            <p>Are you sure you want to unfriend <strong>{selectedUnfriend.first_name} {selectedUnfriend.last_name}</strong>?</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowUnfriendModal(false); setSelectedUnfriend(null); }}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleUnfriend}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#ff4444", color: "white", cursor: "pointer", fontWeight: "600" }}
              >
                Unfriend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Group Chats ── */}
      {(groups.length > 0 || true) && (
        <div className="groups-section">
          <div className="groups-section-header">
            <h3 className="groups-section-title">Group Chats</h3>
            <button className="fh-btn fh-btn--ghost fh-btn--sm" onClick={() => setShowNewGroup(true)}>
              <HiOutlineUserGroup size={14} />
              <span>New</span>
            </button>
          </div>
          {groups.length === 0 ? (
            <button className="group-empty-card" onClick={() => setShowNewGroup(true)}>
              <div className="group-empty-icon">
                <HiOutlineUserGroup size={22} />
              </div>
              <div>
                <p className="group-empty-title">Create a group chat</p>
                <p className="group-empty-sub">Chat with multiple friends at once</p>
              </div>
              <FiChevronRight size={16} color="#bbb" style={{ marginLeft: "auto" }} />
            </button>
          ) : (
            <div className="friends-list">
              {groups.map(group => (
                <button key={group.id} className="friend-row" onClick={() => onOpenGroup(group)}>
                  <img src={groupAvatar} alt="Group" className="friend-row-avatar" />
                  <div className="friend-row-info">
                    <p className="friend-row-name">{group.name}</p>
                    <p className="friend-row-username">Group Chat</p>
                  </div>
                  <div className="friend-row-chat-icon">
                    <FiMessageCircle size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Friend Requests Panel ── */}
      {showRequests && (
        <div className="requests-overlay" onClick={() => setShowRequests(false)}>
          <div className="requests-panel" onClick={e => e.stopPropagation()}>
            <div className="requests-panel-header">
              <h3>Requests {requests.length > 0 && <span className="panel-count">{requests.length}</span>}</h3>
              <button className="panel-close-btn" onClick={() => setShowRequests(false)}><FiX size={18} /></button>
            </div>
            {requests.length === 0 ? (
              <div className="no-requests">
                <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map(req => (
                  <div key={req.user_id} className="request-card">
                    <img
                      src={req.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.user_id}`}
                      alt={req.username}
                      className="friend-row-avatar"
                    />
                    <div className="friend-row-info">
                      <p className="friend-row-name">{req.first_name} {req.last_name}</p>
                      <p className="friend-row-username">@{req.username}</p>
                    </div>
                    <div className="request-actions">
                      <button className="accept-btn" onClick={() => handleAccept(req.user_id)}><FiCheck size={14} /></button>
                      <button className="decline-btn" onClick={() => handleDecline(req.user_id)}><FiX size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── New Group Panel ── */}
      {showNewGroup && (
        <div className="requests-overlay" onClick={() => { setShowNewGroup(false); setSelectedMembers([]); setNewGroupName(""); }}>
          <div className="requests-panel" onClick={e => e.stopPropagation()}>
            <div className="requests-panel-header">
              <h3>New Group</h3>
              <button className="panel-close-btn" onClick={() => { setShowNewGroup(false); setSelectedMembers([]); setNewGroupName(""); }}><FiX size={18} /></button>
            </div>
            <input
              type="text"
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="group-name-field"
            />
            <p className="add-member-label">Select friends <span className="member-count">{selectedMembers.length}/7</span></p>
            <div className="add-member-list">
              {friends.map(friend => {
                const selected = selectedMembers.includes(friend.user_id);
                return (
                  <div
                    key={friend.user_id}
                    className={`add-member-row ${selected ? "add-member-row--selected" : ""}`}
                    onClick={() => {
                      if (!selected && selectedMembers.length >= 7) { alert("Max 7 friends"); return; }
                      setSelectedMembers(prev => selected ? prev.filter(id => id !== friend.user_id) : [...prev, friend.user_id]);
                    }}
                  >
                    <img
                      src={friend.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`}
                      alt={friend.username}
                      className="add-member-avatar"
                    />
                    <div className="add-member-info">
                      <p>{friend.first_name} {friend.last_name}</p>
                      <span>@{friend.username}</span>
                    </div>
                    <div className={`add-member-check ${selected ? "add-member-check--on" : ""}`}>
                      {selected && <FiCheck size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="save-group-btn"
              disabled={!newGroupName.trim() || selectedMembers.length === 0}
              onClick={async () => {
                if (!newGroupName.trim() || selectedMembers.length === 0) return;
                await onOpenGroup(null, newGroupName, selectedMembers);
                setShowNewGroup(false); setSelectedMembers([]); setNewGroupName("");
              }}
            >
              Create Group · {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""}
            </button>

            {/* //new */}
            {showUnfriendModal && selectedUnfriend && (
  <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
    <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "90%", maxWidth: "360px" }}>
      <h3 style={{ margin: "0 0 12px" }}>Unfriend</h3>
      <p>Are you sure you want to unfriend <strong>{selectedUnfriend.first_name} {selectedUnfriend.last_name}</strong>?</p>
      <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "flex-end" }}>
        <button
          onClick={() => { setShowUnfriendModal(false); setSelectedUnfriend(null); }}
          style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          onClick={handleUnfriend}
          style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#ff4444", color: "white", cursor: "pointer", fontWeight: "600" }}
        >
          Unfriend
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        </div>
      )}
    </div>
  );
}