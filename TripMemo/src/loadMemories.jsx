import React, { useState, useEffect } from "react";


export default function Memories({setActiveTab }) {
  const [memories, setMemories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [memoryName, setMemoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState(null);

  //current user id
  const user = "10101019";

  const DBentry = async (user_id, mn) => {
    const fd = new FormData();
    fd.append("action", "create");
    fd.append("user_id", user_id);
    fd.append("title", mn);
    
    fetch("http://localhost:5000/memories", {
        method: "POST",
        body: fd,
        })
        .then((res) => res.json())
        .then((data) => {
        //console.log("Memory created:", data);
        })
        .catch((err) => {
        console.error("Error:", err);
        });
  };

  const DBdelete = async (memory_id) => {
    const fd = new FormData();
    fd.append("action", "delete");
    fd.append("memory_id", memory_id);
    
    fetch("http://localhost:5000/memories", {
        method: "POST",
        body: fd,
        })
        .then((res) => res.json())
        .then((data) => {
        console.log("Memory deleted:", data);
        })
        .catch((err) => {
        console.error("Error:", err);
        });
  };

  useEffect(() => {
    const fd = new FormData();
    fd.append("action", "fetch");
    fd.append("user_id", "10101019");

    fetch("http://localhost:5000/memories", {
      method: "POST",
      body: fd,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched memories:", data);
        setMemories(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  const handleCreateMemory = () => {
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (memoryName.trim()) {
      const newMemory = {
        memory_id: memories.length + 1,
        title: memoryName,
        thumbnail: "",
      };
      setMemories([...memories, newMemory]);
      setMemoryName("");
      setShowForm(false);
      DBentry(user, memoryName);
    }
  };

  const toggleMenu = (memoryId, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === memoryId ? null : memoryId);
  };

  const handleDeleteClick = (memoryId, e) => {
    e.stopPropagation();
    setMemoryToDelete(memoryId);
    setShowDeleteConfirm(true);
    setActiveMenu(null);
  };

  const confirmDelete = () => {
    if (memoryToDelete) {
      setMemories(memories.filter(memory => memory.memory_id !== memoryToDelete));
      DBdelete(memoryToDelete);
    }
    setShowDeleteConfirm(false);
    setMemoryToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMemoryToDelete(null);
  };

  const handleCancel = () => {
    setMemoryName("");
    setShowForm(false);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleCardDoubleClick = (memoryId) => {
    // Navigate to memory detail page with id and user
    






    setActiveTab("upload");






  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          showForm || showDeleteConfirm ? "opacity-50 z-40" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => {
          if (showForm) handleCancel();
          if (showDeleteConfirm) cancelDelete();
        }}
      />

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveMenu(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Create Memory Form */}
        <div
          className={`fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-slate-200 transform transition-transform duration-300 ease-out z-50 ${
            showForm ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Create New Memory
            </h2>
            <div>
              <div className="mb-4">
                <label
                  htmlFor="memoryName"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Memory Name
                </label>
                <input
                  type="text"
                  id="memoryName"
                  value={memoryName}
                  onChange={(e) => setMemoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                  placeholder="Enter memory name..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        <div
          className={`fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-slate-200 transform transition-transform duration-300 ease-out z-50 ${
            showDeleteConfirm ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Delete Memory
            </h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this memory? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-5 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-slate-800">My Memories</h1>

          <button
            onClick={handleCreateMemory}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Memory
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory) => (
            <div
              key={memory.memory_id}
              onDoubleClick={() => handleCardDoubleClick(memory.memory_id)}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer relative"
            >
              {/* Three dots menu button */}
              <button
                onClick={(e) => toggleMenu(memory.memory_id, e)}
                className="absolute top-3 right-3 z-10 bg-white hover:bg-gray-100 text-gray-600 p-2 rounded-full shadow-md transition-colors"
                aria-label="Menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {activeMenu === memory.memory_id && (
                <div className="absolute top-14 right-3 z-20 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={(e) => handleDeleteClick(memory.memory_id, e)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              )}

              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                {memory.thumbnail ? (
                  <img
                    src={memory.thumbnail}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-16 h-16 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-800 truncate">
                  {memory.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}