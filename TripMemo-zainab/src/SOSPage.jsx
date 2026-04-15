import React, { useState } from "react";
import { FiX, FiTrash2, FiUserPlus } from "react-icons/fi";
import { MdEmergency } from "react-icons/md";

// SOSSetup Component
function SOSSetup({ isOpen, onClose, friends, sosContacts, onAddSosContact, onRemoveSosContact }) {
  if (!isOpen) return null;

  const isAlreadyAdded = (friendId) => {
    return sosContacts.some(c => c.user_id === friendId);
  };

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
            Select friends to add as emergency contacts
          </p>

          {/* Current SOS contacts */}
          {sosContacts.length > 0 && (
            <>
              <h3 className="sos-section-label">Your Emergency Contacts</h3>
              <div className="contacts-list">
                {sosContacts.map(contact => (
                  <div key={contact.user_id} className="contact-item">
                    <div>
                      <p className="contact-name">{contact.first_name} {contact.last_name}</p>
                      <p className="contact-phone">@{contact.username}</p>
                    </div>
                    <button
                      onClick={() => onRemoveSosContact(contact.user_id)}
                      className="remove-btn"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Friends list to add */}
          <h3 className="sos-section-label">Add from Friends</h3>
          {friends.length === 0 ? (
            <p className="no-friends-sos">You have no friends to add yet</p>
          ) : (
            <div className="contacts-list">
              {friends.map(friend => (
                <div key={friend.user_id} className="contact-item">
                  <div>
                    <p className="contact-name">{friend.first_name} {friend.last_name}</p>
                    <p className="contact-phone">@{friend.username}</p>
                  </div>
                  {isAlreadyAdded(friend.user_id) ? (
                    <span className="already-added">Added ✓</span>
                  ) : (
                    <button
                      onClick={() => onAddSosContact(friend)}
                      className="add-btn"
                    >
                      <FiUserPlus /> Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button onClick={onClose} className="save-btn">Done</button>
        </div>
      </div>
    </div>
  );
}

// SOSConfirmation Component
function SOSConfirmation({ isOpen, onConfirm, onCancel, contactCount }) {
  const [countdown, setCountdown] = useState(3);

  React.useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isOpen && countdown === 0) {
      onConfirm();
    }
  }, [isOpen, countdown, onConfirm]);

  React.useEffect(() => {
    if (isOpen) setCountdown(3);
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
          Your location and emergency message will be sent to {contactCount} contact{contactCount !== 1 ? "s" : ""}
        </p>
        <div className="countdown">{countdown}</div>
        <button onClick={onCancel} className="cancel-btn-large">Cancel</button>
      </div>
    </div>
  );
}

// SOSSuccess Component
function SOSSuccess({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content sos-success">
        <div className="success-icon">✓</div>
        <h2>Alert Sent</h2>
        <p>Your emergency contacts have been notified with your location.</p>
        <button onClick={onClose} className="ok-btn">OK</button>
      </div>
    </div>
  );
}

// Main SOS Page
export function SOSPage({ userId, friends, sosContacts, onAddSosContact, onRemoveSosContact }) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSendAlert = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          const text = `🚨 EMERGENCY ALERT 🚨\n\nI need help! This is my location:\nhttps://www.google.com/maps?q=${latitude},${longitude}\n\nTime: ${timestamp}`;

          // Send message to each SOS contact via MongoDB messages
          for (const contact of sosContacts) {
            try {
              await fetch("http://localhost:5000/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  senderId: userId,
                  receiverId: contact.user_id,
                  text
                }),
                credentials: "include"
              });
            } catch (err) {
              console.error("Failed to send emergency message to", contact.username, err);
            }
          }

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
    if (sosContacts.length === 0) {
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
          <h2>Emergency Contacts ({sosContacts.length})</h2>
          <button className="manage-contacts-btn" onClick={() => setSetupOpen(true)}>
            {sosContacts.length === 0 ? "Add Contacts" : "Manage"}
          </button>
        </div>

        {sosContacts.length === 0 ? (
          <div className="no-contacts">
            <p>No emergency contacts added yet</p>
            <button className="add-first-contact-btn" onClick={() => setSetupOpen(true)}>
              Add Your First Contact
            </button>
          </div>
        ) : (
          <div className="sos-contacts-list">
            {sosContacts.map(contact => (
              <div key={contact.user_id} className="sos-contact-card">
                <div className="contact-avatar">
                  {contact.first_name.charAt(0).toUpperCase()}
                </div>
                <div className="contact-details">
                  <p className="contact-name">{contact.first_name} {contact.last_name}</p>
                  <p className="contact-phone">@{contact.username}</p>
                </div>
                <button
                  className="remove-sos-btn"
                  onClick={() => onRemoveSosContact(contact.user_id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <SOSSetup
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        friends={friends}
        sosContacts={sosContacts}
        onAddSosContact={onAddSosContact}
        onRemoveSosContact={onRemoveSosContact}
      />

      <SOSConfirmation
        isOpen={confirmOpen}
        onConfirm={handleSendAlert}
        onCancel={() => setConfirmOpen(false)}
        contactCount={sosContacts.length}
      />

      <SOSSuccess isOpen={successOpen} onClose={() => setSuccessOpen(false)} />
    </div>
  );
}

export default SOSPage;




// import React, { useState, useEffect } from "react";
// import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
// import { MdEmergency } from "react-icons/md";

// // SOSSetup Component - for managing emergency contacts
// function SOSSetup({ isOpen, onClose, contacts, onSaveContacts }) {
//   const [localContacts, setLocalContacts] = useState(contacts);
//   const [newContact, setNewContact] = useState({ name: "", phone: "" });

//   // Keep localContacts in sync if parent contacts change
//   useEffect(() => {
//     setLocalContacts(contacts);
//   }, [contacts]);

//   // ✅ Helper: newest first (last added on top)
//   const sortedLocalContacts = [...localContacts].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

//   const handleAddContact = () => {
//     if (newContact.name && newContact.phone) {
//       // ✅ ensure newest has the largest id, so sorting works
//       const contactToAdd = { ...newContact, id: Date.now() };
//       setLocalContacts([...localContacts, contactToAdd]);
//       setNewContact({ name: "", phone: "" });
//     }
//   };

//   const handleRemoveContact = (id) => {
//     setLocalContacts(localContacts.filter((c) => c.id !== id));
//   };

//   const handleSave = () => {
//     onSaveContacts(localContacts);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content sos-setup">
//         <div className="modal-header">
//           <h2>Emergency Contacts</h2>
//           <button onClick={onClose} className="close-btn">
//             <FiX />
//           </button>
//         </div>

//         <div className="sos-setup-body">
//           <p className="setup-description">
//             Add contacts who will receive your location in an emergency
//           </p>

//           {/* Existing contacts (NEWEST FIRST) */}
//           <div className="contacts-list">
//             {sortedLocalContacts.map((contact) => (
//               <div key={contact.id} className="contact-item">
//                 <div>
//                   <p className="contact-name">{contact.name}</p>
//                   <p className="contact-phone">{contact.phone}</p>
//                 </div>
//                 <button
//                   onClick={() => handleRemoveContact(contact.id)}
//                   className="remove-btn"
//                 >
//                   <FiTrash2 />
//                 </button>
//               </div>
//             ))}
//           </div>

//           {/* Add new contact form */}
//           <div className="add-contact-form">
//             <input
//               type="text"
//               placeholder="Contact name"
//               value={newContact.name}
//               onChange={(e) =>
//                 setNewContact({ ...newContact, name: e.target.value })
//               }
//               className="contact-input"
//             />
//             <input
//               type="tel"
//               placeholder="User ID"
//               value={newContact.phone}
//               onChange={(e) =>
//                 setNewContact({ ...newContact, phone: e.target.value })
//               }
//               className="contact-input"
//             />
//             <button onClick={handleAddContact} className="add-btn">
//               <FiPlus /> Add Contact
//             </button>
//           </div>

//           <button onClick={handleSave} className="save-btn">
//             Save Contacts
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // SOSConfirmation Component - confirmation dialog before sending
// function SOSConfirmation({ isOpen, onConfirm, onCancel, contactCount }) {
//   const [countdown, setCountdown] = useState(3);

//   useEffect(() => {
//     if (isOpen && countdown > 0) {
//       const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
//       return () => clearTimeout(timer);
//     } else if (isOpen && countdown === 0) {
//       onConfirm();
//     }
//   }, [isOpen, countdown, onConfirm]);

//   useEffect(() => {
//     if (isOpen) {
//       setCountdown(3);
//     }
//   }, [isOpen]);

//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content sos-confirm">
//         <div className="sos-confirm-icon">
//           <MdEmergency size={60} />
//         </div>
//         <h2>Send Emergency Alert?</h2>
//         <p className="sos-confirm-text">
//           Your location and emergency message will be sent to {contactCount}{" "}
//           contact{contactCount !== 1 ? "s" : ""}
//         </p>
//         <div className="countdown">{countdown}</div>
//         <button onClick={onCancel} className="cancel-btn-large">
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// }

// // SOSSuccess Component - shows after alert is sent
// function SOSSuccess({ isOpen, onClose }) {
//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content sos-success">
//         <div className="success-icon">✓</div>
//         <h2>Alert Sent</h2>
//         <p>Your emergency contacts have been notified with your location.</p>
//         <button onClick={onClose} className="ok-btn">
//           OK
//         </button>
//       </div>
//     </div>
//   );
// }

// // Main SOS Page Component - THIS IS WHAT SHOWS IN THE TAB
// export function SOSPage({ contacts, onSaveContacts, onSendMessage }) {
//   const [setupOpen, setSetupOpen] = useState(false);
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [successOpen, setSuccessOpen] = useState(false);

//   // ✅ Helper: newest first (last added on top)
//   const sortedContacts = [...contacts].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

//   const handleSendAlert = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           const timestamp = new Date().toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           });

//           const location = { latitude, longitude };

//           // Send emergency message to ALL contacts
//           contacts.forEach((contact) => {
//             // Send emergency message
//             onSendMessage({
//               id: Date.now() + contact.id,
//               contactId: contact.id,
//               type: "sent",
//               text: "🚨 EMERGENCY - I need help!",
//               location: location,
//               timestamp,
//               isEmergency: true,
//             });

//             // Send system notification
//             onSendMessage({
//               id: Date.now() + contact.id + 1,
//               contactId: contact.id,
//               type: "system",
//               text: `Emergency alert sent to ${contact.name}`,
//               timestamp,
//             });
//           });

//           const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help. This is my location.\n\nLocation: https://www.google.com/maps?q=${latitude},${longitude}\nTime: ${timestamp}`;

//           console.log("Sending to contacts:", contacts);
//           console.log("Message:", message);
//           console.log("GPS:", location);

//           setConfirmOpen(false);
//           setSuccessOpen(true);
//         },
//         (error) => {
//           console.error("Location error:", error);
//           alert("Could not get your location. Please enable location services.");
//           setConfirmOpen(false);
//         }
//       );
//     } else {
//       alert("Geolocation is not supported by your browser.");
//       setConfirmOpen(false);
//     }
//   };

//   const triggerSOS = () => {
//     if (contacts.length === 0) {
//       setSetupOpen(true);
//     } else {
//       setConfirmOpen(true);
//     }
//   };

//   return (
//     <div className="sos-page">
//       <div className="sos-header">
//         <h1>Emergency SOS</h1>
//         <p className="sos-subtitle">Quick access to emergency services</p>
//       </div>

//       <div className="sos-main-button-container">
//         <button className="sos-main-button" onClick={triggerSOS}>
//           <MdEmergency size={80} />
//           <span>Send Emergency Alert</span>
//         </button>
//         <p className="sos-help-text">
//           Press to send your location to emergency contacts
//         </p>
//       </div>

//       <div className="sos-contacts-section">
//         <div className="sos-section-header">
//           <h2>Emergency Contacts ({contacts.length})</h2>
//           <button className="manage-contacts-btn" onClick={() => setSetupOpen(true)}>
//             {contacts.length === 0 ? "Add Contacts" : "Manage"}
//           </button>
//         </div>

//         {contacts.length === 0 ? (
//           <div className="no-contacts">
//             <p>No emergency contacts added yet</p>
//             <button
//               className="add-first-contact-btn"
//               onClick={() => setSetupOpen(true)}
//             >
//               Add Your First Contact
//             </button>
//           </div>
//         ) : (
//           <div className="sos-contacts-list">
//             {/* ✅ NEWEST FIRST */}
//             {sortedContacts.map((contact) => (
//               <div key={contact.id} className="sos-contact-card">
//                 <div className="contact-avatar">
//                   {contact.name.charAt(0).toUpperCase()}
//                 </div>
//                 <div className="contact-details">
//                   <p className="contact-name">{contact.name}</p>
//                   <p className="contact-phone">{contact.phone}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modals */}
//       <SOSSetup
//         isOpen={setupOpen}
//         onClose={() => setSetupOpen(false)}
//         contacts={contacts}
//         onSaveContacts={onSaveContacts}
//       />

//       <SOSConfirmation
//         isOpen={confirmOpen}
//         onConfirm={handleSendAlert}
//         onCancel={() => setConfirmOpen(false)}
//         contactCount={contacts.length}
//       />

//       <SOSSuccess isOpen={successOpen} onClose={() => setSuccessOpen(false)} />
//     </div>
//   );
// }

// export default SOSPage;