import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import "./BucketList.css";

export default function BucketListModal({ isOpen, onClose, onSave, initialValue = "" }) {
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