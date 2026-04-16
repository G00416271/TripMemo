import React, { useState, useEffect } from "react";
import { FiUsers, FiChevronRight, FiX, FiCheck, FiUserPlus } from "react-icons/fi";
import "./Friends.css";
import groupAvatar from "./assets/gc_avatar.png";

export default function FriendsPage({ userId, friends, onOpenChat, onAccept, onOpenGroup, groups = [], onLeaveGroup }) {
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetchRequests();
  }, [userId]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`http://localhost:5000/users/${userId}/friend-requests`, {
        credentials: "include"
      });
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  const handleAccept = async (senderId) => {
    try {
      await fetch(`http://localhost:5000/users/friend-request/${senderId}/accept`, {
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
      await fetch(`http://localhost:5000/users/friend-request/${senderId}/decline`, {
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

  return (
    <div className="friends-page">

      {/* Header */}
      <div className="friends-header">
        <h2>Friends</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="requests-btn" onClick={() => setShowNewGroup(true)}>
            <FiUsers size={16} />
            <span style={{ fontSize: "11px", marginLeft: "4px" }}>New Group</span>
          </button>
          <button className="requests-btn" onClick={() => setShowRequests(true)}>
            <FiUsers />
            {requests.length > 0 && (
              <span className="requests-badge">{requests.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Friends List */}
      {friends.length === 0 ? (
        <div className="no-friends">
          <FiUsers size={48} color="#ccc" />
          <p>No friends yet</p>
          <small>Search for people on the home page to add friends</small>
        </div>
      ) : (
        <div className="friends-list">
          {friends.map(friend => (
            <button
              key={friend.user_id}
              className="friend-row"
              onClick={() => onOpenChat(friend)}
            >
              <img
                src={friend.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`}
                alt={friend.username}
                className="friend-row-avatar"
              />
              <div className="friend-row-info">
                <p className="friend-row-name">{friend.first_name} {friend.last_name}</p>
                <p className="friend-row-username">@{friend.username}</p>
              </div>
              <FiChevronRight color="#ccc" />
            </button>
          ))}
        </div>
      )}

      {/* Group Chats */}
      <div className="groups-section">
        <h3 className="groups-section-title">Group Chats</h3>
        {groups.length === 0 ? (
          <p className="no-groups">No group chats yet</p>
        ) : (
          groups.map(group => (
            <button
              key={group.id}
              className="friend-row"
              onClick={() => onOpenGroup(group)}
            >
              <img src={groupAvatar} alt="Group" className="friend-row-avatar" />
              <div className="friend-row-info">
                <p className="friend-row-name">{group.name}</p>
                <p className="friend-row-username">Group Chat</p>
              </div>
              <FiChevronRight color="#ccc" />
            </button>
          ))
        )}
      </div>

      {/* Friend Requests Panel */}
      {showRequests && (
        <div className="requests-overlay">
          <div className="requests-panel">
            <div className="requests-panel-header">
              <h3>Friend Requests</h3>
              <button onClick={() => setShowRequests(false)}>
                <FiX size={20} />
              </button>
            </div>
            {requests.length === 0 ? (
              <div className="no-requests">
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
                      <button className="accept-btn" onClick={() => handleAccept(req.user_id)}>
                        <FiCheck />
                      </button>
                      <button className="decline-btn" onClick={() => handleDecline(req.user_id)}>
                        <FiX />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Group Panel */}
      {showNewGroup && (
        <div className="requests-overlay">
          <div className="requests-panel">
            <div className="requests-panel-header">
              <h3>New Group</h3>
              <button onClick={() => { setShowNewGroup(false); setSelectedMembers([]); setNewGroupName(""); }}>
                <FiX size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="group-name-field"
            />

            <p className="add-member-label">Select friends to add (max 7):</p>
            {friends.map(friend => (
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
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(friend.user_id)}
                  onChange={(e) => {
                    if (e.target.checked && selectedMembers.length >= 7) {
                      alert("Max 7 friends (8 including you)");
                      return;
                    }
                    setSelectedMembers(prev =>
                      e.target.checked
                        ? [...prev, friend.user_id]
                        : prev.filter(id => id !== friend.user_id)
                    );
                  }}
                />
              </div>
            ))}

            <button
              className="save-group-btn"
              onClick={async () => {
                if (!newGroupName.trim()) {
                  alert("Please enter a group name");
                  return;
                }
                if (selectedMembers.length === 0) {
                  alert("Please select at least one friend");
                  return;
                }
                await onOpenGroup(null, newGroupName, selectedMembers);
                setShowNewGroup(false);
                setSelectedMembers([]);
                setNewGroupName("");
              }}
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}





// import React, { useState, useEffect } from "react";
// import { FiUsers, FiChevronRight, FiX, FiCheck } from "react-icons/fi";
// import "./Friends.css";
// import groupAvatar from "./assets/gc_avatar.png";

// const PLACEHOLDER_AVATAR = "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png";

// export default function FriendsPage({ userId, friends, onOpenChat, onAccept, onOpenGroup, groups = [], onLeaveGroup }) {
//   const [requests, setRequests] = useState([]);
//   const [showRequests, setShowRequests] = useState(false);

//   useEffect(() => {
//     if (!userId) return;
//     fetchRequests();
//   }, [userId]);

//   const fetchRequests = async () => {
//     try {
//       const res = await fetch(`http://localhost:5000/users/${userId}/friend-requests`, {
//         credentials: "include"
//       });
//       const data = await res.json();
//       setRequests(data);
//     } catch (err) {
//       console.error("Failed to fetch requests:", err);
//     }
//   };

//   const handleAccept = async (senderId) => {
//     try {
//       await fetch(`http://localhost:5000/users/friend-request/${senderId}/accept`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId }),
//         credentials: "include"
//       });
//       setRequests(prev => prev.filter(r => r.user_id !== senderId));
//       onAccept (); 
//     } catch (err) {
//       console.error("Failed to accept request:", err);
//     }
//   };

//   const handleDecline = async (senderId) => {
//     try {
//       await fetch(`http://localhost:5000/users/friend-request/${senderId}/decline`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId }),
//         credentials: "include"
//       });
//       setRequests(prev => prev.filter(r => r.user_id !== senderId));
//     } catch (err) {
//       console.error("Failed to decline request:", err);
//     }
//   };

//   const [showNewGroup, setShowNewGroup] = useState(false);
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [newGroupName, setNewGroupName] = useState("");

//   return (
//     <div className="friends-page">
//       {/* Header */}
//       <div className="friends-header">
//         <h2>Friends</h2>
//         <button
//           className="requests-btn"
//           onClick={() => setShowRequests(true)}
//         >
//           <FiUsers />
//           {requests.length > 0 && (
//             <span className="requests-badge">{requests.length}</span>
//           )}
//         </button>
//       </div>

//       {/* Friends List */}
//       {friends.length === 0 ? (
//         <div className="no-friends">
//           <FiUsers size={48} color="#ccc" />
//           <p>No friends yet</p>
//           <small>Search for people on the home page to add friends</small>
//         </div>
//       ) : (
//         <div className="friends-list">
//           {friends.map(friend => (
//             <button
//               // key={friend._id}
//               key={friend.user_id}
//               className="friend-row"
//               onClick={() => onOpenChat(friend)}
//             >

//               {/* Group Chats */}
// <div className="groups-section">
//   <h3 className="groups-section-title">Group Chats</h3>
//   {groups.length === 0 ? (
//     <p className="no-groups">No group chats yet</p>
//   ) : (
//     groups.map(group => (
//       <button
//         key={group.id}
//         className="friend-row"
//         onClick={() => onOpenGroup(group)}
//       >
//         <img src={groupAvatar} alt="Group" className="friend-row-avatar" />
//         <div className="friend-row-info">
//           <p className="friend-row-name">{group.name}</p>
//           <p className="friend-row-username">Group Chat</p>
//         </div>
//         <FiChevronRight color="#ccc" />
//       </button>
//     ))
//   )}
// </div>

// {showNewGroup && (
//   <div className="requests-overlay">
//     <div className="requests-panel">
//       <div className="requests-panel-header">
//         <h3>New Group</h3>
//         <button onClick={() => { setShowNewGroup(false); setSelectedMembers([]); setNewGroupName(""); }}>
//           <FiX size={20} />
//         </button>
//       </div>

//       <input
//         type="text"
//         placeholder="Group name..."
//         value={newGroupName}
//         onChange={(e) => setNewGroupName(e.target.value)}
//         className="group-name-field"
//       />

//       <p className="add-member-label">Select friends to add (max 7):</p>
//       {friends.map(friend => (
//         <div key={friend.user_id} className="add-member-row">
//           <img
//             src={friend.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`}
//             alt={friend.username}
//             className="add-member-avatar"
//           />
//           <div className="add-member-info">
//             <p>{friend.first_name} {friend.last_name}</p>
//             <span>@{friend.username}</span>
//           </div>
//           <input
//             type="checkbox"
//             checked={selectedMembers.includes(friend.user_id)}
//             onChange={(e) => {
//               if (e.target.checked && selectedMembers.length >= 7) {
//                 alert("Max 7 friends (8 including you)");
//                 return;
//               }
//               setSelectedMembers(prev =>
//                 e.target.checked
//                   ? [...prev, friend.user_id]
//                   : prev.filter(id => id !== friend.user_id)
//               );
//             }}
//           />
//         </div>
//       ))}

//       <button
//         className="save-group-btn"
//         onClick={async () => {
//           if (!newGroupName.trim()) {
//             alert("Please enter a group name");
//             return;
//           }
//           if (selectedMembers.length === 0) {
//             alert("Please select at least one friend");
//             return;
//           }
//           await onOpenGroup(null, newGroupName, selectedMembers);
//           setShowNewGroup(false);
//           setSelectedMembers([]);
//           setNewGroupName("");
//         }}
//       >
//         Create Group
//       </button>
//     </div>
//   </div>
// )}
//               {/* <img src={PLACEHOLDER_AVATAR} alt={friend.username} className="friend-row-avatar" /> */}
//             <img
//               src={friend.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.user_id}`}
//               alt={friend.username}
//               className="friend-row-avatar"
//             />
//               <div className="friend-row-info">
//                 <p className="friend-row-name">{friend.first_name} {friend.last_name}</p>
//                 <p className="friend-row-username">@{friend.username}</p>
//               </div>
//               <FiChevronRight color="#ccc" />
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Requests Side Panel */}
//       {showRequests && (
//         <div className="requests-overlay">
//           <div className="requests-panel">
//             <div className="requests-panel-header">
//               <h3>Friend Requests</h3>
//               <button onClick={() => setShowRequests(false)}>
//                 <FiX size={20} />
//               </button>
//             </div>

//             <div className="friends-header">
//   <h2>Friends</h2>
//   <div style={{ display: "flex", gap: "8px" }}>
//     <button className="requests-btn" onClick={() => setShowNewGroup(true)}>
//       <FiUsers size={18} />
//       <span style={{ fontSize: "11px", marginLeft: "4px" }}>Group</span>
//     </button>
//     <button className="requests-btn" onClick={() => setShowRequests(true)}>
//       <FiUsers />
//       {requests.length > 0 && (
//         <span className="requests-badge">{requests.length}</span>
//       )}
//     </button>
//   </div>
// </div>

//             {requests.length === 0 ? (
//               <div className="no-requests">
//                 <p>No pending requests</p>
//               </div>
//             ) : (
//               <div className="requests-list">
//                 {requests.map(req => (
//                   <div key={req.user_id} className="request-card">
//                     {/* <img src={PLACEHOLDER_AVATAR} alt={req.username} className="friend-row-avatar" /> */}
//                     <img
//                       src={req.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.user_id}`}
//                       alt={req.username}
//                       className="friend-row-avatar"
//                     />
//                     <div className="friend-row-info">
//                       <p className="friend-row-name">{req.first_name} {req.last_name}</p>
//                       <p className="friend-row-username">@{req.username}</p>
//                     </div>
//                     <div className="request-actions">
//                       <button
//                         className="accept-btn"
//                         onClick={() => handleAccept(req.user_id)}
//                         // onClick={() => handleAccept(req._id)}
//                       >
//                         <FiCheck />
//                       </button>
//                       <button
//                         className="decline-btn"
//                         onClick={() => handleDecline(req.user_id)}
//                         // onClick={() => handleDecline(req._id)}
//                       >
//                         <FiX />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }