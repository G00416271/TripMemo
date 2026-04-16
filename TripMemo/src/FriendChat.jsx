import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiArrowLeft } from "react-icons/fi";
// import "./FriendChat.css";
import "./Friends.css";

const PLACEHOLDER_AVATAR = "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png";

export default function FriendChat({ friend, userId, onBack, onViewEmergencyLocation }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

 useEffect(() => {
  fetchMessages();



  // change- three seconds is a lot of quereys 
  const interval = setInterval(fetchMessages, 3000); // check every 3 seconds
  return () => clearInterval(interval); // cleanup on unmount
}, [friend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  

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
          // receiverId: friend._id,
          receiverId: friend.user_id,
          text: inputMessage
        }),
        credentials: "include"
      });

      const newMessage = await res.json();
      setMessages(prev => [...prev, newMessage]);
      setInputMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="friend-chat">
      {/* Header */}
      <div className="friend-chat-header">
        <button className="back-btn" onClick={onBack}>
          <FiArrowLeft size={20} />
        </button>
        <img src={PLACEHOLDER_AVATAR} alt={friend.username} className="friend-chat-avatar" />
        <div className="friend-chat-info">
          <p className="friend-chat-name">{friend.first_name} {friend.last_name}</p>
          <p className="friend-chat-username">@{friend.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="friend-chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <img src={PLACEHOLDER_AVATAR} alt={friend.username} className="no-messages-avatar" />
            <p>You're now friends with {friend.first_name}!</p>
            <small>Say hello 👋</small>
          </div>
        ) : (
          messages.map(msg => {
  const isEmergency = msg.text.includes("🚨 EMERGENCY ALERT 🚨");
  const locationMatch = msg.text.match(/q=([-\d.]+),([-\d.]+)/);
  const location = locationMatch ? {
    lat: parseFloat(locationMatch[1]),
    lng: parseFloat(locationMatch[2])
  } : null;

  return (
    <div
      key={msg._id}
      className={`chat-bubble ${msg.senderId === userId ? "sent" : "received"} ${isEmergency ? "emergency-bubble" : ""}`}
    >
      {isEmergency && (
        <div className="emergency-label">🚨 Emergency Alert</div>
      )}
      <p>{msg.text}</p>
      {isEmergency && location && (
        <button
          className="view-on-map-btn"
          onClick={() => onViewEmergencyLocation(location)}
        >
          📍 View on Map
        </button>
      )}
      <span className="bubble-time">
        {new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}
      </span>
    </div>
  );
})
          // messages.map(msg => (
          //   <div
          //     key={msg._id}
          //     className={`chat-bubble ${msg.senderId === userId ? "sent" : "received"}`}
          //   >
          //     <p>{msg.text}</p>
          //     <span className="bubble-time">
          //       {new Date(msg.createdAt).toLocaleTimeString([], {
          //         hour: "2-digit",
          //         minute: "2-digit"
          //       })}
          //     </span>
          //   </div>
          // ))
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
          <FiSend />
        </button>
      </form>
    </div>
  );
}