export default function Trophy({ memoryId, memoryName, serverData }) {

  const thumbnail = serverData?.thumbnail;
  const title = memoryName;

  return (
<div
              key={memory.memory_id}
              onClick={() => handleCardClick(memory.memory_id, memory.title)}
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
  );
}