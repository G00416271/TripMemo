import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function ImageSearch() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PIXABAY_API_KEY = '53481167-b261e4a8fd5c85523c6b9b422'; // Zainab's API key

  const searchImages = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
  setError('Please enter a search term');
  return;
}

setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=20`
      );
      
      const data = await response.json();
      
      if (data.hits) {
        setImages(data.hits);
      } else {
        setError('No images found');
      }
    } catch (err) {
      setError('Failed to fetch images. Please try again.');
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Image Search
        </h1>
        
        {/* Search Form */}
        <form onSubmit={searchImages} className="mb-8">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for images... (e.g., sunset, nature, cats)"
                className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:outline-none text-gray-700"
              />
              <Search className="absolute right-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Images Grid */}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              >
                <img
                  src={image.webformatURL}
                  alt={image.tags}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <p className="text-sm text-gray-600 truncate">{image.tags}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>❤️ {image.likes}</span>
                    <span>👁️ {image.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && images.length === 0 && query && !error && (
          <div className="text-center py-12 text-gray-500">
            No images found. Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
}