import React, { useState, useEffect, useRef } from "react";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import "./BucketList.css";

import adventureSticker from "./assets/stickers/adventure-sticker.png";
import bluebpSticker from "./assets/stickers/bluebp-sticker.png";
import bonvoyageSticker from "./assets/stickers/bonvoyage-sticker.png";
import getoutSticker from "./assets/stickers/getout-sticker.png";
import roadtripSticker from "./assets/stickers/roadtrip-sticker.png";
import travelSticker from "./assets/stickers/travel-sticker.png";

const STICKERS = [
  { name: "adventure", src: adventureSticker },
  { name: "bluebp", src: bluebpSticker },
  { name: "bonvoyage", src: bonvoyageSticker },
  { name: "getout", src: getoutSticker },
  { name: "roadtrip", src: roadtripSticker },
  { name: "travel", src: travelSticker },
];

//const EMOJI_LIST = ["⭐", "🌍", "✈️", "🏖️", "🏔️", "🗺️", "🎒", "📸", "🌅", "🍜", "🎭", "🏛️", "🌊", "🎡", "🌺", "🦁", "🐬", "🎿", "🚢", "🏕️", "🎪", "🌴", "🗼", "🎠"];

export default function BucketListEditor({ bucketList, onBack }) {
  const [items, setItems] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, [bucketList.id]);

  const fetchItems = async () => {
    try {
      const res = await fetch(`http://https://tripmemo-11.onrender.com/bucket-lists/${bucketList.id}/items`, {
        credentials: "include"
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    }
  };

  const addTextItem = async () => {
    try {
      const res = await fetch(`http://https://tripmemo-11.onrender.com/bucket-lists/${bucketList.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          content: "",
          position: items.length
        }),
        credentials: "include"
      });
      const newItem = await res.json();
      setItems(prev => [...prev, newItem]);
    } catch (err) {
      console.error("Failed to add item:", err);
    }
  };

//   const addEmojiItem = async (emoji) => {
//     try {
//       const res = await fetch(`http://https://tripmemo-11.onrender.com/bucket-lists/${bucketList.id}/items`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           type: "emoji",
//           content: emoji,
//           position: items.length
//         }),
//         credentials: "include"
//       });
//       const newItem = await res.json();
//       setItems(prev => [...prev, newItem]);
//       setShowEmojiPicker(false);
//     } catch (err) {
//       console.error("Failed to add emoji:", err);
//     }
//   };

const addStickerItem = async (sticker) => {
  try {
    const res = await fetch(`http://https://tripmemo-11.onrender.com/bucket-lists/${bucketList.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "emoji",
        content: sticker.src,
        position: items.length
      }),
      credentials: "include"
    });
    const newItem = await res.json();
    setItems(prev => [...prev, newItem]);
    setShowEmojiPicker(false);
  } catch (err) {
    console.error("Failed to add sticker:", err);
  }
};

  const addImageItem = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const res = await fetch(`http://https://tripmemo-11.onrender.com/bucket-lists/${bucketList.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "image",
            content: event.target.result,
            position: items.length
          }),
          credentials: "include"
        });
        const newItem = await res.json();
        setItems(prev => [...prev, newItem]);
      } catch (err) {
        console.error("Failed to add image:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateTextItem = async (id, content) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, content } : item));

    try {
      await fetch(`http://https://tripmemo-11.onrender.com/bucket-lists/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include"
      });
    } catch (err) {
      console.error("Failed to update item:", err);
    }
  };

  const deleteItem = async (id) => {
    try {
      await fetch(`http://https://tripmemo-11.onrender.com/bucket-lists/items/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

    const toggleCheck = async (id, checked) => {
  setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !checked } : item));
  try {
    await fetch(`http://https://tripmemo-11.onrender.com/bucket-lists/items/${id}/check`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !checked }),
      credentials: "include"
    });
  } catch (err) {
    console.error("Failed to check item:", err);
  }
};

  return (
    <div className="bucket-editor">
      <div className="bucket-editor-header">
        <button className="back-btn" onClick={onBack}>
          <FiArrowLeft size={20} />
        </button>
        <h2>{bucketList.title}</h2>
        <p className="bucket-editor-date">
          {new Date(bucketList.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </p>
      </div>

      <div className="bucket-editor-content">
        {items.length === 0 && (
          <div className="bucket-empty">
            <p>Your bucket list is empty</p>
            <small>Add items using the buttons below</small>
          </div>
        )}

        {items.map(item => (
          <div key={item.id} className="bucket-item">
            {/* {item.type === "text" && (
              <div className="bucket-text-item">
                <span className="bucket-bullet">☐</span>
                <input
                  type="text"
                  placeholder="Add something to your bucket list..."
                  value={item.content}
                //   onChange={(e) => updateTextItem(item.id, e.target.value)}
                onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, content: e.target.value } : i))}
                onBlur={(e) => updateTextItem(item.id, e.target.value)}
                  className="bucket-text-input"
                />
                <button className="bucket-item-delete" onClick={() => deleteItem(item.id)}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            )} */}

            {item.type === "text" && (
  <div className="bucket-text-item">
    <button
      className={`bucket-checkbox ${item.checked ? "checked" : ""}`}
      onClick={() => toggleCheck(item.id, item.checked)}
    >
      {item.checked ? "☑" : "☐"}
    </button>
    {/* <input
      type="text"
      placeholder="Add something to your bucket list..."
      value={item.content}
      onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, content: e.target.value } : i))}
      onBlur={(e) => updateTextItem(item.id, e.target.value)}
      className={`bucket-text-input ${item.checked ? "checked-text" : ""}`}
    /> */}
    <input
  type="text"
  placeholder="Add something to your bucket list..."
  value={item.content}
  onChange={(e) => {
    const newContent = e.target.value;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, content: newContent } : i));
    // Save after 500ms of no typing
    clearTimeout(window[`timer_${item.id}`]);
    window[`timer_${item.id}`] = setTimeout(() => {
      updateTextItem(item.id, newContent);
    }, 500);
  }}
  onBlur={(e) => {
    clearTimeout(window[`timer_${item.id}`]);
    updateTextItem(item.id, e.target.value);
  }}
  className={`bucket-text-input ${item.checked ? "checked-text" : ""}`}
/>
    <button className="bucket-item-delete" onClick={() => deleteItem(item.id)}>
      <FiTrash2 size={14} />
    </button>
  </div>
)}

            {/* {item.type === "emoji" && (
              <div className="bucket-emoji-item">
                <span className="bucket-emoji">{item.content}</span>
                <button className="bucket-item-delete" onClick={() => deleteItem(item.id)}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            )} */}

            {item.type === "emoji" && (
  <div className="bucket-emoji-item">
    <img src={item.content} alt="sticker" className="bucket-sticker-img" />
    <button className="bucket-item-delete" onClick={() => deleteItem(item.id)}>
      <FiTrash2 size={14} />
    </button>
  </div>
)}

            {item.type === "image" && (
              <div className="bucket-image-item">
                <img src={item.content} alt="bucket list" className="bucket-image" />
                <button className="bucket-item-delete bucket-image-delete" onClick={() => deleteItem(item.id)}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Emoji Picker */}
      {/* {showEmojiPicker && (
        <div className="emoji-picker">
          {EMOJI_LIST.map(emoji => (
            <button key={emoji} className="emoji-option" onClick={() => addEmojiItem(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )} */}
        {showEmojiPicker && (
  <div className="emoji-picker">
    {STICKERS.map(sticker => (
      <button
        key={sticker.name}
        className="sticker-option"
        onClick={() => addStickerItem(sticker)}
      >
        <img src={sticker.src} alt={sticker.name} className="sticker-preview" />
      </button>
    ))}
  </div>
)}


      {/* Bottom Toolbar */}
      <div className="bucket-toolbar">
        <button className="bucket-tool-btn" onClick={addTextItem}>
          ☐ Add Item
        </button>
        {/* <button className="bucket-tool-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          😊 Sticker
        </button> */}

        <button className="bucket-tool-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
  🎨 Stickers
</button>

        <button className="bucket-tool-btn" onClick={() => fileInputRef.current.click()}>
          📷 Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={addImageItem}
        />
      </div>
    </div>
  );
}