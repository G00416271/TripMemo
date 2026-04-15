import React, { useState } from "react";
import { FiArrowLeft, FiTrash2, FiEdit2, FiPlus, FiX } from "react-icons/fi";
import "./BucketList.css";

function BucketListModal({ isOpen, onClose, onSave, initialValue = "" }) {
  const [title, setTitle] = useState(initialValue);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim());
    setTitle("");
  };

  return (
    <div className="bucket-modal-overlay">
      <div className="bucket-modal">
        <div className="bucket-modal-header">
          <h3>{initialValue ? "Rename Bucket List" : "New Bucket List"}</h3>
          <button className="bucket-modal-close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>
        <input
          type="text"
          placeholder="e.g. My Next Adventure"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bucket-modal-input"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <div className="bucket-modal-actions">
          <button className="bucket-modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="bucket-modal-save"
            onClick={handleSave}
            disabled={!title.trim()}
          >
            {initialValue ? "Rename" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BucketListsPage({ bucketLists, onOpen, onCreate, onDelete, onRename, onBack }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingList, setEditingList] = useState(null);

  const handleCreate = (title) => {
    onCreate(title);
    setModalOpen(false);
  };

  const handleRename = (title) => {
    onRename(editingList.id, title);
    setEditingList(null);
  };

  return (
    <div className="bucket-lists-page">
      <div className="bucket-lists-header">
        <button className="back-btn" onClick={onBack}>
          <FiArrowLeft size={20} />
        </button>
        <h2>My Bucket Lists</h2>
        <button className="bucket-add-btn" onClick={() => setModalOpen(true)}>
          <FiPlus size={20} />
        </button>
      </div>

      {bucketLists.length === 0 ? (
        <div className="no-bucket-lists">
          <p>No bucket lists yet</p>
          <small>Tap the + button to create your first one</small>
        </div>
      ) : (
        <div className="bucket-lists-list">
          {bucketLists.map(list => (
            <div
              key={list.id}
              className="bucket-list-row"
              onClick={() => onOpen(list)}
            >
              <div className="bucket-list-row-info">
                <p className="bucket-list-row-title">{list.title}</p>
                <p className="bucket-list-row-date">
                  {new Date(list.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>
              <div className="bucket-list-row-actions">
                <button
                  className="bucket-list-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingList(list);
                  }}
                >
                  <FiEdit2 size={15} />
                </button>
                <button
                  className="bucket-list-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(list.id);
                  }}
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <BucketListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreate}
      />

      {/* Rename Modal */}
      <BucketListModal
        isOpen={!!editingList}
        onClose={() => setEditingList(null)}
        onSave={handleRename}
        initialValue={editingList?.title || ""}
      />
    </div>
  );
}










// import React from "react";
// import { FiArrowLeft, FiTrash2, FiPlus } from "react-icons/fi";
// import "./BucketList.css";

// export default function BucketListsPage({ bucketLists, onOpen, onCreate, onDelete, onBack }) {
//   return (
//     <div className="bucket-lists-page">
//       <div className="bucket-lists-header">
//         <button className="back-btn" onClick={onBack}>
//           <FiArrowLeft size={20} />
//         </button>
//         <h2>My Bucket Lists</h2>
//         <button className="bucket-add-btn" onClick={onCreate}>
//           <FiPlus size={20} />
//         </button>
//       </div>

//       {bucketLists.length === 0 ? (
//         <div className="no-bucket-lists">
//           <p>No bucket lists yet</p>
//           <small>Tap the + button to create your first one</small>
//         </div>
//       ) : (
//         <div className="bucket-lists-list">
//           {bucketLists.map(list => (
//             <div
//               key={list.id}
//               className="bucket-list-row"
//               onClick={() => onOpen(list)}
//             >
//               <div className="bucket-list-row-info">
//                 <p className="bucket-list-row-title">{list.title}</p>
//                 <p className="bucket-list-row-date">
//                   {new Date(list.created_at).toLocaleDateString("en-GB", {
//                     day: "numeric",
//                     month: "long",
//                     year: "numeric"
//                   })}
//                 </p>
//               </div>
//               <button
//                 className="bucket-list-delete-btn"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   if (confirm(`Delete "${list.title}"?`)) {
//                     onDelete(list.id);
//                   }
//                 }}
//               >
//                 <FiTrash2 size={16} />
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }