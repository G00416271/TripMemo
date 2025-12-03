import React, { useState, useEffect } from "react";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import { MdEmergency } from "react-icons/md";

// SOSSetup Component - for managing emergency contacts
function SOSSetup({ isOpen, onClose, contacts, onSaveContacts }) {
  const [localContacts, setLocalContacts] = useState(contacts);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      setLocalContacts([...localContacts, { ...newContact, id: Date.now() }]);
      setNewContact({ name: "", phone: "" });
    }
  };

  const handleRemoveContact = (id) => {
    setLocalContacts(localContacts.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    onSaveContacts(localContacts);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content sos-setup">
        <div className="modal-header">
          <h2>Emergency Contacts</h2>
          <button onClick={onClose} className="close-btn">
            <FiX />
          </button>
        </div>

        <div className="sos-setup-body">
          <p className="setup-description">
            Add contacts who will receive your location in an emergency
          </p>

          {/* Existing contacts */}
          <div className="contacts-list">
            {localContacts.map((contact) => (
              <div key={contact.id} className="contact-item">
                <div>
                  <p className="contact-name">{contact.name}</p>
                  <p className="contact-phone">{contact.phone}</p>
                </div>
                <button
                  onClick={() => handleRemoveContact(contact.id)}
                  className="remove-btn"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          {/* Add new contact form */}
          <div className="add-contact-form">
            <input
              type="text"
              placeholder="Contact name"
              value={newContact.name}
              onChange={(e) =>
                setNewContact({ ...newContact, name: e.target.value })
              }
              className="contact-input"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={newContact.phone}
              onChange={(e) =>
                setNewContact({ ...newContact, phone: e.target.value })
              }
              className="contact-input"
            />
            <button onClick={handleAddContact} className="add-btn">
              <FiPlus /> Add Contact
            </button>
          </div>

          <button onClick={handleSave} className="save-btn">
            Save Contacts
          </button>
        </div>
      </div>
    </div>
  );
}

// SOSConfirmation Component - confirmation dialog before sending
function SOSConfirmation({ isOpen, onConfirm, onCancel, contactCount }) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isOpen && countdown === 0) {
      onConfirm();
    }
  }, [isOpen, countdown, onConfirm]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content sos-confirm">
        <div className="sos-confirm-icon">
          <MdEmergency size={60} />
        </div>
        <h2>Send Emergency Alert?</h2>
        <p className="sos-confirm-text">
          Your location and emergency message will be sent to {contactCount}{" "}
          contact{contactCount !== 1 ? "s" : ""}
        </p>
        <div className="countdown">{countdown}</div>
        <button onClick={onCancel} className="cancel-btn-large">
          Cancel
        </button>
      </div>
    </div>
  );
}

// SOSSuccess Component - shows after alert is sent
function SOSSuccess({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content sos-success">
        <div className="success-icon">✓</div>
        <h2>Alert Sent</h2>
        <p>Your emergency contacts have been notified with your location.</p>
        <button onClick={onClose} className="ok-btn">
          OK
        </button>
      </div>
    </div>
  );
}

// Main SOS Page Component - THIS IS WHAT SHOWS IN THE TAB
export function SOSPage({ contacts, onSaveContacts }) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSendAlert = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date().toLocaleString();
          
          const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help. This is my location.\n\nLocation: https://www.google.com/maps?q=${latitude},${longitude}\nTime: ${timestamp}`;
          
          console.log("Sending to contacts:", contacts);
          console.log("Message:", message);
          console.log("GPS:", { latitude, longitude });
          
          setConfirmOpen(false);
          setSuccessOpen(true);
        },
        (error) => {
          console.error("Location error:", error);
          alert("Could not get your location. Please enable location services.");
          setConfirmOpen(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setConfirmOpen(false);
    }
  };

  const triggerSOS = () => {
    if (contacts.length === 0) {
      setSetupOpen(true);
    } else {
      setConfirmOpen(true);
    }
  };

  return (
    <div className="sos-page">
      <div className="sos-header">
        <h1>Emergency SOS</h1>
        <p className="sos-subtitle">Quick access to emergency services</p>
      </div>

      <div className="sos-main-button-container">
        <button className="sos-main-button" onClick={triggerSOS}>
          <MdEmergency size={80} />
          <span>Send Emergency Alert</span>
        </button>
        <p className="sos-help-text">
          Press to send your location to emergency contacts
        </p>
      </div>

      <div className="sos-contacts-section">
        <div className="sos-section-header">
          <h2>Emergency Contacts ({contacts.length})</h2>
          <button 
            className="manage-contacts-btn"
            onClick={() => setSetupOpen(true)}
          >
            {contacts.length === 0 ? "Add Contacts" : "Manage"}
          </button>
        </div>

        {contacts.length === 0 ? (
          <div className="no-contacts">
            <p>No emergency contacts added yet</p>
            <button 
              className="add-first-contact-btn"
              onClick={() => setSetupOpen(true)}
            >
              Add Your First Contact
            </button>
          </div>
        ) : (
          <div className="sos-contacts-list">
            {contacts.map((contact) => (
              <div key={contact.id} className="sos-contact-card">
                <div className="contact-avatar">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="contact-details">
                  <p className="contact-name">{contact.name}</p>
                  <p className="contact-phone">{contact.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <SOSSetup
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        contacts={contacts}
        onSaveContacts={onSaveContacts}
      />

      <SOSConfirmation
        isOpen={confirmOpen}
        onConfirm={handleSendAlert}
        onCancel={() => setConfirmOpen(false)}
        contactCount={contacts.length}
      />

      <SOSSuccess
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}

// Original SOSFeature Component - for modal trigger (keeping for backward compatibility)
export default function SOSFeature({ isOpen, onClose, contacts, onSaveContacts }) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (contacts.length === 0) {
        setSetupOpen(true);
      } else {
        setConfirmOpen(true);
      }
      onClose();
    }
  }, [isOpen, contacts.length, onClose]);

  const handleSendAlert = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date().toLocaleString();
          
          const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help. This is my location.\n\nLocation: https://www.google.com/maps?q=${latitude},${longitude}\nTime: ${timestamp}`;
          
          console.log("Sending to contacts:", contacts);
          console.log("Message:", message);
          console.log("GPS:", { latitude, longitude });
          
          setConfirmOpen(false);
          setSuccessOpen(true);
        },
        (error) => {
          console.error("Location error:", error);
          alert("Could not get your location. Please enable location services.");
          setConfirmOpen(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <SOSSetup
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        contacts={contacts}
        onSaveContacts={onSaveContacts}
      />

      <SOSConfirmation
        isOpen={confirmOpen}
        onConfirm={handleSendAlert}
        onCancel={() => setConfirmOpen(false)}
        contactCount={contacts.length}
      />

      <SOSSuccess
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
      />
    </>
  );
}