import React, { useState, useEffect, useRef } from "react";
import { FiArrowLeft, FiSend, FiMoreVertical, FiUserPlus, FiLogOut, FiEdit2, FiX, FiCheck, FiUsers } from "react-icons/fi";
import groupAvatar from "./assets/gc_avatar.png";
import "./GroupChat.css";

export default function GroupChat({ group, userId, userName, friends, onBack, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [newName, setNewName] = useState(group.name);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendTarget, setAddFriendTarget] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchMembers();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [group]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://localhost:5000/groups/${group.id}/messages`, {
        credentials: "include"
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`http://localhost:5000/groups/${group.id}/members`, {
        credentials: "include"
      });
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  const getMemberColour = (senderId) => {
    const member = members.find(m => m.user_id === senderId);
    return member?.colour || "#888";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/groups/${group.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: userId, senderName: userName, text: inputMessage }),
        credentials: "include"
      });
      const newMessage = await res.json();
      setMessages(prev => [...prev, newMessage]);
      setInputMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleLeave = async () => {
    try {
      await fetch(`http://localhost:5000/groups/${group.id}/members/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
        credentials: "include"
      });
      setShowLeaveModal(false);
      onLeave(group.id);
    } catch (err) {
      console.error("Failed to leave group:", err);
    }
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      await fetch(`http://localhost:5000/groups/${group.id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
        credentials: "include"
      });
      setGroupName(newName);
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to rename group:", err);
    }
  };

  const handleAddMember = async (friendId) => {
    try {
      const res = await fetch(`http://localhost:5000/groups/${group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: friendId }),
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      fetchMembers();
      setShowAddMemberModal(false);
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    try {
      await fetch(`http://localhost:5000/users/friend-request/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: userId }),
        credentials: "include"
      });
      setPendingRequests(prev => [...prev, targetUserId]);
      setShowAddFriendModal(false);
      setAddFriendTarget(null);
    } catch (err) {
      console.error("Failed to send friend request:", err);
    }
  };

  const isMutual = (memberId) => friends.some(f => f.user_id === memberId);
  const isPending = (memberId) => pendingRequests.includes(memberId);
  const isAlreadyMember = (friendId) => members.some(m => m.user_id === friendId);
  const addableFriends = friends.filter(f => !isAlreadyMember(f.user_id));

  return (
    <div className="group-chat">
      {/* Header */}
      <div className="group-chat-header">
        <button className="back-btn" onClick={onBack}>
          <FiArrowLeft size={20} />
        </button>
        <img src={groupAvatar} alt="Group" className="group-chat-avatar" />
        <div className="group-chat-info">
          {isEditingName ? (
            <div className="group-name-edit">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="group-name-input"
                autoFocus
              />
              <button onClick={handleRename} className="group-name-save">
                <FiCheck size={14} />
              </button>
              <button onClick={() => setIsEditingName(false)} className="group-name-cancel">
                <FiX size={14} />
              </button>
            </div>
          ) : (
            <p className="group-chat-name" onClick={() => setIsEditingName(true)}>
              {groupName}
            </p>
          )}
          <p className="group-chat-members">{members.length} members</p>
        </div>
        <button className="group-settings-btn" onClick={() => setShowSettings(!showSettings)}>
          <FiMoreVertical size={20} />
        </button>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="group-settings-dropdown">
          <button onClick={() => { setShowMembersModal(true); setShowSettings(false); }}>
            <FiUsers size={14} /> View Members
          </button>
          <button onClick={() => { setShowAddMemberModal(true); setShowSettings(false); }}>
            <FiUserPlus size={14} /> Add Member
          </button>
          <button onClick={() => { setIsEditingName(true); setShowSettings(false); }}>
            <FiEdit2 size={14} /> Rename Group
          </button>
          <button className="leave-btn" onClick={() => { setShowLeaveModal(true); setShowSettings(false); }}>
            <FiLogOut size={14} /> Leave Group
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="group-chat-messages">
        {messages.map(msg => (
          <div key={msg._id} className={`group-message ${msg.type === 'system' ? 'system-message' : msg.senderId === userId ? 'sent' : 'received'}`}>
            {msg.type === 'system' ? (
              <p className="system-text">{msg.text}</p>
            ) : (
              <>


              {msg.senderId !== userId && (
  <div className="group-message-sender">
    <span style={{ color: getMemberColour(msg.senderId) }}>
      {msg.senderName}
      {!isMutual(msg.senderId) && !isPending(msg.senderId) &&
        messages.findLastIndex(m => m.senderId === msg.senderId) === messages.indexOf(msg) && (
          <button
            onClick={() => { setAddFriendTarget({ id: msg.senderId, name: msg.senderName }); setShowAddFriendModal(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "4px", fontSize: "14px" }}
          >
            ➕
          </button>
        )}
      {isPending(msg.senderId) &&
        messages.findLastIndex(m => m.senderId === msg.senderId) === messages.indexOf(msg) && (
          <span style={{ fontSize: "11px", color: "#aaa", marginLeft: "4px" }}>Pending</span>
        )}
    </span>
  </div>
)}


                {/* {msg.senderId !== userId && (
                  <div className="group-message-sender">
                    <span style={{ color: getMemberColour(msg.senderId) }}>
                      {msg.senderName}
                      {!isMutual(msg.senderId) && !isPending(msg.senderId) &&
                        messages.findLastIndex(m => m.senderId === msg.senderId) === messages.indexOf(msg) && (
                          <button
                            onClick={() => { setAddFriendTarget({ id: msg.senderId, name: msg.senderName }); setShowAddFriendModal(true); }}
                            style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "4px", fontSize: "14px" }}
                          >
                            ➕
                          </button>
                        )}
                      {isPending(msg.senderId) &&
                        messages.findLastIndex(m => m.senderId === msg.senderId) === messages.indexOf(msg) && (
                          <span style={{ fontSize: "11px", color: "#aaa", marginLeft: "4px" }}>Pending</span>
                        )}
                    </span>
                  </div>
                )} */}
                <div
                  className="group-bubble"
                  style={msg.senderId !== userId ? { borderLeftColor: getMemberColour(msg.senderId) } : {}}
                >
                  <p>{msg.text}</p>
                  <span className="bubble-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="group-chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Message group..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button type="submit" className="send-btn">
          <FiSend />
        </button>
      </form>

      {/* Leave Group Modal */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Leave Group</h3>
            <p>Are you sure you want to leave <strong>{groupName}</strong>?</p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowLeaveModal(false)}>Cancel</button>
              <button className="modal-confirm-btn" onClick={handleLeave}>Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {showMembersModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Members</h3>
              <button onClick={() => setShowMembersModal(false)}><FiX /></button>
            </div>
            {members.map(member => (
              <div key={member.user_id} className="add-member-row">
                <img
                  src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.user_id}`}
                  alt={member.username}
                  className="add-member-avatar"
                />
                <div className="add-member-info">
                  <p>{member.first_name} {member.last_name}</p>
                  <span>@{member.username}</span>
                </div>
                {member.user_id === userId && (
                  <span style={{ fontSize: "11px", color: "#888" }}>You</span>
                )}
                {member.user_id !== userId && isMutual(member.user_id) && (
                  <span style={{ fontSize: "11px", color: "#4CAF50" }}>Friend ✓</span>
                )}
                {member.user_id !== userId && !isMutual(member.user_id) && (
                  <button
                    className="add-member-btn"
                    onClick={() => !isPending(member.user_id) && handleAddFriend(member.user_id)}
                    style={isPending(member.user_id) ? { background: "#ccc", cursor: "not-allowed" } : {}}
                    disabled={isPending(member.user_id)}
                  >
                    {isPending(member.user_id) ? "Pending" : "Add"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Member</h3>
              <button onClick={() => setShowAddMemberModal(false)}><FiX /></button>
            </div>
            {addableFriends.length === 0 ? (
              <p className="no-addable">No friends to add</p>
            ) : (
              addableFriends.map(friend => (
                <div key={friend.user_id} className="add-member-row">
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`}
                    alt={friend.username}
                    className="add-member-avatar"
                  />
                  <div className="add-member-info">
                    <p>{friend.first_name} {friend.last_name}</p>
                    <span>@{friend.username}</span>
                  </div>
                  <button className="add-member-btn" onClick={() => handleAddMember(friend.user_id)}>
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriendModal && addFriendTarget && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Add Friend</h3>
            <p>Send a friend request to <strong>{addFriendTarget.name}</strong>?</p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => { setShowAddFriendModal(false); setAddFriendTarget(null); }}>Cancel</button>
              <button className="modal-confirm-btn" style={{ background: "#4CAF50" }} onClick={() => handleAddFriend(addFriendTarget.id)}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}











// import React, { useState, useEffect, useRef } from "react";
// import { FiArrowLeft, FiSend, FiMoreVertical, FiUserPlus, FiLogOut, FiEdit2, FiX, FiCheck } from "react-icons/fi";
// import groupAvatar from "./assets/gc_avatar.png";
// import "./GroupChat.css";

// export default function GroupChat({ group, userId, userName, friends, onBack, onLeave }) {
//   const [messages, setMessages] = useState([]);
//   const [members, setMembers] = useState([]);
//   const [inputMessage, setInputMessage] = useState("");
//   const [showSettings, setShowSettings] = useState(false);
//   const [showAddMember, setShowAddMember] = useState(false);
//   const [isEditingName, setIsEditingName] = useState(false);
//   const [groupName, setGroupName] = useState(group.name);
//   const [newName, setNewName] = useState(group.name);
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     fetchMessages();
//     fetchMembers();

//     const interval = setInterval(fetchMessages, 3000);
//     return () => clearInterval(interval);
//   }, [group]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const fetchMessages = async () => {
//     try {
//       const res = await fetch(`http://localhost:5000/groups/${group.id}/messages`, {
//         credentials: "include"
//       });
//       const data = await res.json();
//       setMessages(data);
//     } catch (err) {
//       console.error("Failed to fetch messages:", err);
//     }
//   };

//   const fetchMembers = async () => {
//     try {
//       const res = await fetch(`http://localhost:5000/groups/${group.id}/members`, {
//         credentials: "include"
//       });
//       const data = await res.json();
//       setMembers(data);
//     } catch (err) {
//       console.error("Failed to fetch members:", err);
//     }
//   };

//   const getMemberColour = (senderId) => {
//     const member = members.find(m => m.user_id === senderId);
//     return member?.colour || "#888";
//   };

//   const handleSend = async (e) => {
//     e.preventDefault();
//     if (!inputMessage.trim()) return;

//     try {
//       const res = await fetch(`http://localhost:5000/groups/${group.id}/messages`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           senderId: userId,
//           senderName: userName,
//           text: inputMessage
//         }),
//         credentials: "include"
//       });
//       const newMessage = await res.json();
//       setMessages(prev => [...prev, newMessage]);
//       setInputMessage("");
//     } catch (err) {
//       console.error("Failed to send message:", err);
//     }
//   };

//   const handleLeave = async () => {
//     if (!confirm(`Are you sure you want to leave "${groupName}"?`)) return;
//     try {
//       await fetch(`http://localhost:5000/groups/${group.id}/members/${userId}`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userName }),
//         credentials: "include"
//       });
//       onLeave(group.id);
//     } catch (err) {
//       console.error("Failed to leave group:", err);
//     }
//   };

//   const handleRename = async () => {
//     if (!newName.trim()) return;
//     try {
//       await fetch(`http://localhost:5000/groups/${group.id}/name`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name: newName }),
//         credentials: "include"
//       });
//       setGroupName(newName);
//       setIsEditingName(false);
//     } catch (err) {
//       console.error("Failed to rename group:", err);
//     }
//   };

//   const handleAddMember = async (friendId) => {
//     try {
//       const res = await fetch(`http://localhost:5000/groups/${group.id}/members`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId: friendId }),
//         credentials: "include"
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         alert(data.error);
//         return;
//       }
//       fetchMembers();
//       setShowAddMember(false);
//     } catch (err) {
//       console.error("Failed to add member:", err);
//     }
//   };

//   const handleAddFriend = async (targetUserId) => {
//     try {
//       await fetch(`http://localhost:5000/users/friend-request/${targetUserId}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ senderId: userId }),
//         credentials: "include"
//       });
//       alert("Friend request sent!");
//     } catch (err) {
//       console.error("Failed to send friend request:", err);
//     }
//   };

//   const isMutual = (memberId) => friends.some(f => f.user_id === memberId);
//   const isAlreadyMember = (friendId) => members.some(m => m.user_id === friendId);
//   const addableFriends = friends.filter(f => !isAlreadyMember(f.user_id));

//   return (
//     <div className="group-chat">
//       {/* Header */}
//       <div className="group-chat-header">
//         <button className="back-btn" onClick={onBack}>
//           <FiArrowLeft size={20} />
//         </button>
//         <img src={groupAvatar} alt="Group" className="group-chat-avatar" />
//         <div className="group-chat-info">
//           {isEditingName ? (
//             <div className="group-name-edit">
//               <input
//                 value={newName}
//                 onChange={(e) => setNewName(e.target.value)}
//                 className="group-name-input"
//                 autoFocus
//               />
//               <button onClick={handleRename} className="group-name-save">
//                 <FiCheck size={14} />
//               </button>
//               <button onClick={() => setIsEditingName(false)} className="group-name-cancel">
//                 <FiX size={14} />
//               </button>
//             </div>
//           ) : (
//             <p className="group-chat-name" onClick={() => setIsEditingName(true)}>
//               {groupName}
//             </p>
//           )}
//           <p className="group-chat-members">{members.length} members</p>
//         </div>
//         <button className="group-settings-btn" onClick={() => setShowSettings(!showSettings)}>
//           <FiMoreVertical size={20} />
//         </button>
//       </div>

//       {/* Settings Dropdown */}
//       {showSettings && (
//         <div className="group-settings-dropdown">
//           <button onClick={() => { setShowAddMember(true); setShowSettings(false); }}>
//             <FiUserPlus size={14} /> Add Member
//           </button>
//           <button onClick={() => { setIsEditingName(true); setShowSettings(false); }}>
//             <FiEdit2 size={14} /> Rename Group
//           </button>
//           <button className="leave-btn" onClick={handleLeave}>
//             <FiLogOut size={14} /> Leave Group
//           </button>
//         </div>
//       )}

//       {/* Add Member Panel */}
//       {showAddMember && (
//         <div className="add-member-panel">
//           <div className="add-member-header">
//             <h3>Add Member</h3>
//             <button onClick={() => setShowAddMember(false)}><FiX /></button>
//           </div>
//           {addableFriends.length === 0 ? (
//             <p className="no-addable">No friends to add</p>
//           ) : (
//             addableFriends.map(friend => (
//               <div key={friend.user_id} className="add-member-row">
//                 <img
//                   src={friend.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`}
//                   alt={friend.username}
//                   className="add-member-avatar"
//                 />
//                 <div className="add-member-info">
//                   <p>{friend.first_name} {friend.last_name}</p>
//                   <span>@{friend.username}</span>
//                 </div>
//                 <button
//                   className="add-member-btn"
//                   onClick={() => handleAddMember(friend.user_id)}
//                 >
//                   Add
//                 </button>
//               </div>
//             ))
//           )}
//         </div>
//       )}

//       {/* Messages */}
//       <div className="group-chat-messages">
//         {messages.map(msg => (
//           <div key={msg._id} className={`group-message ${msg.type === 'system' ? 'system-message' : msg.senderId === userId ? 'sent' : 'received'}`}>
//             {msg.type === 'system' ? (
//               <p className="system-text">{msg.text}</p>
//             ) : (
//               <>
//                 {msg.senderId !== userId && (
//                   <div className="group-message-sender">
//                     <span
//                       style={{ color: getMemberColour(msg.senderId), cursor: !isMutual(msg.senderId) && msg.senderId !== userId ? 'pointer' : 'default' }}
//                       onClick={() => {
//                         if (!isMutual(msg.senderId) && msg.senderId !== userId) {
//                           if (confirm(`Add ${msg.senderName} as a friend?`)) {
//                             handleAddFriend(msg.senderId);
//                           }
//                         }
//                       }}
//                     >
//                       {msg.senderName}
//                       {!isMutual(msg.senderId) && msg.senderId !== userId && " ➕"}
//                     </span>
//                   </div>
//                 )}
//                 <div
//                   className="group-bubble"
//                   style={msg.senderId !== userId ? { borderLeftColor: getMemberColour(msg.senderId) } : {}}
//                 >
//                   <p>{msg.text}</p>
//                   <span className="bubble-time">
//                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                   </span>
//                 </div>
//               </>
//             )}
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <form className="group-chat-input" onSubmit={handleSend}>
//         <input
//           type="text"
//           placeholder="Message group..."
//           value={inputMessage}
//           onChange={(e) => setInputMessage(e.target.value)}
//         />
//         <button type="submit" className="send-btn">
//           <FiSend />
//         </button>
//       </form>
//     </div>
//   );
// }