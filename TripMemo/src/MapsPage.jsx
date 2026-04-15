// MapsPage.jsx

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { AiOutlineHeart } from 'react-icons/ai';
import { FiMapPin, FiNavigation, FiTrash2 } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const currentLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="blue" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="blue" opacity="0.3"/>
      <circle cx="12" cy="12" r="3" fill="blue"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const likedLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="red" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// Component to recenter map when current location changes
function MapController({ center, navigationMode }) {
  const map = useMap();
  
  useEffect(() => {
    if (navigationMode && center) {
      map.setView(center, 16);
    }
  }, [center, navigationMode, map]);
  
  return null;
}

export default function MapsPage() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [likedPlaces, setLikedPlaces] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [navigationMode, setNavigationMode] = useState(false);
  const [mapCenter, setMapCenter] = useState([53.3498, -6.2603]); // Dublin default

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(loc);
          setMapCenter(loc);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Track location when tracking is enabled
  useEffect(() => {
    let watchId;

    if (tracking && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(loc);
          setLocationHistory(prev => [...prev, { position: loc, timestamp: Date.now() }]);
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [tracking]);

  const handleLikeCurrentLocation = () => {
    if (currentLocation) {
      const placeName = prompt('Enter a name for this place:');
      if (placeName) {
        setLikedPlaces(prev => [...prev, {
          id: Date.now(),
          position: currentLocation,
          name: placeName,
          timestamp: Date.now()
        }]);
      }
    }
  };

  const removeLikedPlace = (id) => {
    setLikedPlaces(prev => prev.filter(place => place.id !== id));
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation) {
      setMapCenter(currentLocation);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all location history?')) {
      setLocationHistory([]);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Fullscreen Map */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={currentLocation} navigationMode={navigationMode} />

        {/* Current Location Marker */}
        {currentLocation && (
          <Marker position={currentLocation} icon={currentLocationIcon}>
            <Popup>
              <div className="font-semibold">You are here</div>
              {navigationMode && <div className="text-sm text-gray-600">Navigation mode active</div>}
            </Popup>
          </Marker>
        )}

        {/* Location History Path */}
        {locationHistory.length > 1 && (
          <Polyline
            positions={locationHistory.map(loc => loc.position)}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}

        {/* Liked Places */}
        {likedPlaces.map(place => (
          <Marker key={place.id} position={place.position} icon={likedLocationIcon}>
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                  {place.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  {new Date(place.timestamp).toLocaleDateString()}
                </div>
                <button
                  onClick={() => removeLikedPlace(place.id)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Control Buttons - Top Right, Stacked */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={() => setTracking(!tracking)}
          style={{
            padding: '10px 16px',
            backgroundColor: tracking ? '#ef4444' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          {tracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>

        <button
          onClick={handleLikeCurrentLocation}
          disabled={!currentLocation}
          style={{
            padding: '10px 16px',
            backgroundColor: currentLocation ? '#ec4899' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: currentLocation ? 'pointer' : 'not-allowed',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          <AiOutlineHeart size={16} />
          Like Place
        </button>

        <button
          onClick={() => setNavigationMode(!navigationMode)}
          style={{
            padding: '10px 16px',
            backgroundColor: navigationMode ? '#9333ea' : '#e5e7eb',
            color: navigationMode ? 'white' : '#374151',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          <FiNavigation size={16} />
          {navigationMode ? 'Nav On' : 'Nav Off'}
        </button>

        <button
          onClick={centerOnCurrentLocation}
          disabled={!currentLocation}
          style={{
            padding: '10px 16px',
            backgroundColor: currentLocation ? '#3b82f6' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: currentLocation ? 'pointer' : 'not-allowed',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          <FiMapPin size={16} />
          Center
        </button>

        {locationHistory.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              padding: '10px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            <FiTrash2 size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Stats Panel - Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: '80px', // Space for bottom nav
        right: '16px',
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '16px',
        maxWidth: '200px'
      }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>Stats</h3>
        <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div>📍 Visited: {locationHistory.length}</div>
          <div>❤️ Liked: {likedPlaces.length}</div>
          <div style={{ color: tracking ? '#22c55e' : '#6b7280', fontWeight: tracking ? 600 : 400 }}>
            {tracking ? '● Tracking' : '○ Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
}

// import { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
// import { AiOutlineHeart } from 'react-icons/ai';
// import { FiMapPin, FiNavigation, FiTrash2 } from 'react-icons/fi';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // Fix for default marker icons in React-Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// // Custom icons
// const currentLocationIcon = new L.Icon({
//   iconUrl: 'data:image/svg+xml;base64,' + btoa(`
//     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="blue" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//       <circle cx="12" cy="12" r="10" fill="blue" opacity="0.3"/>
//       <circle cx="12" cy="12" r="3" fill="blue"/>
//     </svg>
//   `),
//   iconSize: [24, 24],
//   iconAnchor: [12, 12],
// });

// const likedLocationIcon = new L.Icon({
//   iconUrl: 'data:image/svg+xml;base64,' + btoa(`
//     <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="red" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//       <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
//     </svg>
//   `),
//   iconSize: [30, 30],
//   iconAnchor: [15, 30],
//   popupAnchor: [0, -30],
// });

// // Component to recenter map when current location changes
// function MapController({ center, navigationMode }) {
//   const map = useMap();
  
//   useEffect(() => {
//     if (navigationMode && center) {
//       map.setView(center, 16);
//     }
//   }, [center, navigationMode, map]);
  
//   return null;
// }

// export default function MapsPage() {
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [locationHistory, setLocationHistory] = useState([]);
//   const [likedPlaces, setLikedPlaces] = useState([]);
//   const [tracking, setTracking] = useState(false);
//   const [navigationMode, setNavigationMode] = useState(false);
//   const [mapCenter, setMapCenter] = useState([53.3498, -6.2603]); // Dublin default

//   // Get current location
//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const loc = [position.coords.latitude, position.coords.longitude];
//           setCurrentLocation(loc);
//           setMapCenter(loc);
//         },
//         (error) => {
//           console.error('Error getting location:', error);
//         }
//       );
//     }
//   }, []);

//   // Track location when tracking is enabled
//   useEffect(() => {
//     let watchId;

//     if (tracking && navigator.geolocation) {
//       watchId = navigator.geolocation.watchPosition(
//         (position) => {
//           const loc = [position.coords.latitude, position.coords.longitude];
//           setCurrentLocation(loc);
//           setLocationHistory(prev => [...prev, { position: loc, timestamp: Date.now() }]);
//         },
//         (error) => {
//           console.error('Error watching location:', error);
//         },
//         { enableHighAccuracy: true, maximumAge: 10000 }
//       );
//     }

//     return () => {
//       if (watchId) {
//         navigator.geolocation.clearWatch(watchId);
//       }
//     };
//   }, [tracking]);

//   const handleLikeCurrentLocation = () => {
//     if (currentLocation) {
//       const placeName = prompt('Enter a name for this place:');
//       if (placeName) {
//         setLikedPlaces(prev => [...prev, {
//           id: Date.now(),
//           position: currentLocation,
//           name: placeName,
//           timestamp: Date.now()
//         }]);
//       }
//     }
//   };

//   const removeLikedPlace = (id) => {
//     setLikedPlaces(prev => prev.filter(place => place.id !== id));
//   };

//   const centerOnCurrentLocation = () => {
//     if (currentLocation) {
//       setMapCenter(currentLocation);
//     }
//   };

//   const clearHistory = () => {
//     if (confirm('Clear all location history?')) {
//       setLocationHistory([]);
//     }
//   };

//   return (
//     <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
//       {/* Header */}
//       <div className="bg-blue-600 text-white p-4 shadow-lg">
//         <h1 className="text-2xl font-bold">Maps</h1>
//         <p className="text-sm opacity-90">Track your journey and save favorite places</p>
//       </div>

//       {/* Controls */}
//       <div className="bg-white border-b p-3 flex gap-2 flex-wrap">
//         <button
//           onClick={() => setTracking(!tracking)}
//           className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//             tracking 
//               ? 'bg-red-500 text-white hover:bg-red-600' 
//               : 'bg-green-500 text-white hover:bg-green-600'
//           }`}
//         >
//           {tracking ? 'Stop Tracking' : 'Start Tracking'}
//         </button>

//         <button
//           onClick={handleLikeCurrentLocation}
//           disabled={!currentLocation}
//           className="px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//         >
//           <AiOutlineHeart size={18} />
//           Like This Place
//         </button>

//         <button
//           onClick={() => setNavigationMode(!navigationMode)}
//           className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
//             navigationMode 
//               ? 'bg-purple-600 text-white' 
//               : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//           }`}
//         >
//           <FiNavigation size={18} />
//           {navigationMode ? 'Navigation On' : 'Navigation Off'}
//         </button>

//         <button
//           onClick={centerOnCurrentLocation}
//           disabled={!currentLocation}
//           className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//         >
//           <FiMapPin size={18} />
//           Center on Me
//         </button>

//         {locationHistory.length > 0 && (
//           <button
//             onClick={clearHistory}
//             className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 flex items-center gap-2"
//           >
//             <FiTrash2 size={18} />
//             Clear History
//           </button>
//         )}
//       </div>

//       {/* Map */}
//       <div style={{ flex: 1, position: 'relative', minHeight: '400px' }}>
//         <MapContainer
//           center={mapCenter}
//           zoom={13}
//           style={{ height: '100%', width: '100%' }}
//         >
//           <TileLayer
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           />
          
//           <MapController center={currentLocation} navigationMode={navigationMode} />

//           {/* Current Location Marker */}
//           {currentLocation && (
//             <Marker position={currentLocation} icon={currentLocationIcon}>
//               <Popup>
//                 <div className="font-semibold">You are here</div>
//                 {navigationMode && <div className="text-sm text-gray-600">Navigation mode active</div>}
//               </Popup>
//             </Marker>
//           )}

//           {/* Location History Path */}
//           {locationHistory.length > 1 && (
//             <Polyline
//               positions={locationHistory.map(loc => loc.position)}
//               color="blue"
//               weight={3}
//               opacity={0.7}
//             />
//           )}

//           {/* Liked Places */}
//           {likedPlaces.map(place => (
//             <Marker key={place.id} position={place.position} icon={likedLocationIcon}>
//               <Popup>
//                 <div className="min-w-[150px]">
//                   <div className="font-semibold text-lg mb-1">{place.name}</div>
//                   <div className="text-sm text-gray-600 mb-2">
//                     {new Date(place.timestamp).toLocaleDateString()}
//                   </div>
//                   <button
//                     onClick={() => removeLikedPlace(place.id)}
//                     className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </Popup>
//             </Marker>
//           ))}
//         </MapContainer>

//         {/* Stats Panel */}
//         <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
//           <h3 className="font-bold mb-2">Stats</h3>
//           <div className="text-sm space-y-1">
//             <div>📍 Places visited: {locationHistory.length}</div>
//             <div>❤️ Liked places: {likedPlaces.length}</div>
//             <div className={tracking ? 'text-green-600 font-semibold' : 'text-gray-500'}>
//               {tracking ? '● Tracking active' : '○ Tracking inactive'}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
