import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiArrowLeft, FiMoreVertical } from "react-icons/fi"; //new
import "./Friends.css";

export default function FriendChat({ friend, userId, onBack, onViewEmergencyLocation }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  //new
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);

  // Only auto-scroll if already near the bottom
  const scrollToBottomIfNear = (force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (force || distanceFromBottom < 80) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  //new
  const handleUnfriend = async () => {
  try {
    await fetch(`http://localhost:5000/users/${userId}/friends/${friend.user_id}`, {
      method: "DELETE",
      credentials: "include"
    });
    setShowUnfriendModal(false);
    onBack();
  } catch (err) {
    console.error("Failed to unfriend:", err);
  }
};

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [friend]);

  // Scroll to bottom on initial load (force) and after sending
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottomIfNear();
    }
  }, [messages.length]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/messages/${userId}/${friend.user_id}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    try {
      const res = await fetch("http://localhost:5000/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          receiverId: friend.user_id,
          text: inputMessage,
        }),
        credentials: "include",
      });
      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setInputMessage("");
      // Always scroll after sending your own message
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const friendAvatar = friend.avatar_url ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`;

  return (
    <div className="friend-chat">
      {/* Header */}
      {/* new */}
      <div className="friend-chat-header">
  <button className="back-btn" onClick={onBack}>
    <FiArrowLeft size={18} />
  </button>
  <img
    src={friendAvatar}
    alt={friend.username}
    className="friend-chat-avatar"
  />
  <div className="friend-chat-info">
    <p className="friend-chat-name">{friend.first_name} {friend.last_name}</p>
    <p className="friend-chat-username">@{friend.username}</p>
  </div>
  <div style={{ marginLeft: "auto", position: "relative" }}>
    <button
      onClick={() => setShowDropdown(!showDropdown)}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}
    >
      <FiMoreVertical size={20} color="#888" />
    </button>
    {showDropdown && (
      <div style={{ position: "absolute", right: "0px", top: "100%", background: "white", border: "1px solid #eee", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "120px" }}>
        <button
          onClick={() => { setShowUnfriendModal(true); setShowDropdown(false); }}
          style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", color: "#ff4444", fontSize: "14px" }}
        >
          Unfriend
        </button>
      </div>
    )}
  </div>
</div>

      {/* <div className="friend-chat-header">
        <button className="back-btn" onClick={onBack}>
          <FiArrowLeft size={18} />
        </button>
        <img
          src={friendAvatar}
          alt={friend.username}
          className="friend-chat-avatar"
        />
        <div className="friend-chat-info">
          <p className="friend-chat-name">{friend.first_name} {friend.last_name}</p>
          <p className="friend-chat-username">@{friend.username}</p>
        </div>
      </div> */}

      {/* Messages */}
      <div className="friend-chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="no-messages">
            <img
              src={friendAvatar}
              alt={friend.username}
              className="no-messages-avatar"
            />
            <p>You're friends with {friend.first_name}!</p>
            <small>Say hello 👋</small>
          </div>
        ) : (
          messages.map((msg) => {
            const isEmergency = msg.text?.includes("🚨 EMERGENCY ALERT 🚨");
            const locationMatch = msg.text?.match(/q=([-\d.]+),([-\d.]+)/);
            const location = locationMatch
              ? { lat: parseFloat(locationMatch[1]), lng: parseFloat(locationMatch[2]) }
              : null;
            const isSent = msg.senderId === userId;

            return (
              <div
                key={msg._id}
                className={`chat-bubble-row ${isSent ? "sent" : "received"}`}
              >
                {!isSent && (
                  <img
                    src={friendAvatar}
                    className="bubble-avatar"
                    alt={friend.username}
                  />
                )}
                <div className={`chat-bubble ${isSent ? "sent" : "received"} ${isEmergency ? "emergency-bubble" : ""}`}>
                  {isEmergency && <div className="emergency-label">🚨 Emergency Alert</div>}
                  <p>{msg.text}</p>
                  {isEmergency && location && (
                    <button className="view-on-map-btn" onClick={() => onViewEmergencyLocation(location)}>
                      📍 View on Map
                    </button>
                  )}
                  <span className="bubble-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="friend-chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder={`Message ${friend.first_name}...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button type="submit" className="send-btn">
          <FiSend size={16} />
        </button>
      </form>
        {/* new */}
        {showUnfriendModal && (
  <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
    <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "90%", maxWidth: "360px" }}>
      <h3 style={{ margin: "0 0 12px" }}>Unfriend</h3>
      <p>Are you sure you want to unfriend <strong>{friend.first_name} {friend.last_name}</strong>?</p>
      <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowUnfriendModal(false)}
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
  );
}