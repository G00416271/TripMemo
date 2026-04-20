// ChatRoom.jsx
import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiMapPin, FiUser } from "react-icons/fi";
import { MdEmergency } from "react-icons/md";
import "./ChatRoom.css";

export default function ChatRoom({ 
  emergencyContacts, 
  emergencyMessages = []
}) {
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversations, setConversations] = useState(() => {
    // Load saved conversations from localStorage on startup
    const saved = localStorage.getItem('chatConversations');
    return saved ? JSON.parse(saved) : {};
  });
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatConversations', JSON.stringify(conversations));
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize conversations when emergency messages arrive
  useEffect(() => {
    if (emergencyMessages.length === 0) return;
    
    emergencyMessages.forEach(emergencyMsg => {
      const contactId = emergencyMsg.contactId;
      
      setConversations(prev => {
        const existing = prev[contactId] || [];
        
        // Check if message already exists
        const messageExists = existing.some(msg => 
          msg.id === emergencyMsg.id
        );
        
        if (!messageExists) {
          const updated = {
            ...prev,
            [contactId]: [...existing, emergencyMsg]
          };
          // Save immediately to localStorage
          localStorage.setItem('chatConversations', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
      
      // Auto-select the contact if emergency message received
      if (emergencyMsg.isEmergency) {
        const contact = emergencyContacts.find(c => c.id === contactId);
        if (contact) {
          setSelectedContact(contact);
        }
      }
    });
  }, [emergencyMessages, emergencyContacts]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, selectedContact]);

  const currentMessages = selectedContact 
    ? (conversations[selectedContact.id] || [])
    : [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedContact) return;

    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const newMessage = {
      id: Date.now(),
      type: "sent",
      text: inputMessage,
      timestamp
    };

    setConversations(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage]
    }));
    
    setInputMessage("");

    // In a real app, this would send the message to a backend server
    console.log(`Message sent to ${selectedContact.name}: ${inputMessage}`);
  };

  const handleShareLocation = () => {
    if (!selectedContact) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          setConversations(prev => ({
            ...prev,
            [selectedContact.id]: [
              ...(prev[selectedContact.id] || []),
              {
                id: Date.now(),
                type: "sent",
                text: "📍 My current location",
                location: { latitude, longitude },
                timestamp
              }
            ]
          }));
        },
        (error) => {
          console.error("Location error:", error);
          alert("Could not get your location");
        }
      );
    }
  };

  // Check if contact has unread emergency messages
  const hasEmergencyMessage = (contactId) => {
    const msgs = conversations[contactId] || [];
    return msgs.some(msg => msg.isEmergency && msg.type === "sent");
  };

  return (
    <div className="chatroom">
      {/* Contacts Sidebar */}
      <div className="chatroom-sidebar">
        <div className="chatroom-sidebar-header">
          <h2>Messages</h2>
          <p className="sidebar-subtitle">Chat with your emergency contacts</p>
        </div>
        
        {emergencyContacts.length === 0 ? (
          <div className="no-chat-contacts">
            <FiUser size={48} color="#ccc" />
            <p>No emergency contacts added yet</p>
            <small>Add contacts in the SOS tab to start messaging</small>
          </div>
        ) : (
          <div className="contacts-list-chat">
            {emergencyContacts.map((contact) => {
              const hasMessages = conversations[contact.id]?.length > 0;
              const hasEmergency = hasEmergencyMessage(contact.id);
              const lastMessage = conversations[contact.id]?.[conversations[contact.id].length - 1];
              
              return (
                <button
                  key={contact.id}
                  className={`chat-contact-item ${
                    selectedContact?.id === contact.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="chat-contact-avatar">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-contact-details">
                    <div className="chat-contact-name">
                      {contact.name}
                      {hasEmergency && (
                        <span className="emergency-badge-small">
                          <MdEmergency size={12} />
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <div className="chat-contact-preview">
                        {lastMessage.isEmergency ? "🚨 Emergency alert" : 
                         lastMessage.text.length > 30 ? 
                         lastMessage.text.substring(0, 30) + "..." : 
                         lastMessage.text}
                      </div>
                    )}
                    {!hasMessages && (
                      <div className="chat-contact-phone">{contact.phone}</div>
                    )}
                  </div>
                  {hasEmergency && (
                    <div className="emergency-indicator">
                      <MdEmergency size={20} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="chatroom-main">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="chatroom-header-page">
              <div className="chat-contact-info">
                <div className="chat-avatar">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedContact.name}</h3>
                  <span className="contact-status">
                    {hasEmergencyMessage(selectedContact.id) ? (
                      <span style={{ color: '#ff4757', fontWeight: 600 }}>
                        <MdEmergency size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Emergency Contact
                      </span>
                    ) : (
                      "Emergency Contact"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chatroom-messages">
              {currentMessages.length === 0 ? (
                <div className="no-messages">
                  <FiUser size={48} />
                  <p>No messages yet</p>
                  <small>Start a conversation with {selectedContact.name}</small>
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div key={msg.id} className={`message message-${msg.type}`}>
                    {msg.type === "system" && (
                      <div className="system-message">{msg.text}</div>
                    )}
                    
                    {msg.type === "received" && (
                      <div className="message-bubble received">
                        <p className="message-sender">{msg.sender}</p>
                        <p className="message-text">{msg.text}</p>
                        <span className="message-time">{msg.timestamp}</span>
                      </div>
                    )}
                    
                    {msg.type === "sent" && (
                      <div className="message-bubble sent">
                        {msg.isEmergency && (
                          <div className="emergency-message-badge">
                            <MdEmergency size={16} />
                          </div>
                        )}
                        <p className="message-text">{msg.text}</p>
                        {msg.location && (
                          <a 
                            href={`https://www.google.com/maps?q=${msg.location.latitude},${msg.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="location-link"
                          >
                            <FiMapPin /> View on map
                          </a>
                        )}
                        <span className="message-time">{msg.timestamp}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="chatroom-input" onSubmit={handleSendMessage}>
              <button 
                type="button" 
                className="location-btn"
                onClick={handleShareLocation}
                title="Share location"
              >
                <FiMapPin />
              </button>
              <input
                type="text"
                placeholder={`Message ${selectedContact.name}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button type="submit" className="send-btn">
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div className="no-contact-selected">
            <FiUser size={64} />
            <h3>Select a contact</h3>
            <p>Choose a contact from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}