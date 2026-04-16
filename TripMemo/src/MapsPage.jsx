// MapsPage.jsx

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { AiOutlineHeart } from 'react-icons/ai';
import { FiMapPin, FiNavigation, FiTrash2, FiX } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icon definitions (same as before)
const pendingLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="rgba(236,72,153,0.5)" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

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

const emergencyLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="red" stroke="darkred" stroke-width="2">
      <circle cx="12" cy="12" r="10" fill="rgba(255,0,0,0.2)" stroke="red"/>
      <circle cx="12" cy="12" r="5" fill="red"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Custom Modal Component
function PlaceNameModal({ isOpen, onClose, onSave }) {
  const [placeName, setPlaceName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (placeName.trim()) {
      onSave(placeName.trim());
      setPlaceName('');
    }
  };

  const handleClose = () => {
    setPlaceName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            ❤️ Name this place
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="e.g., Favorite Coffee Shop"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '15px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              outline: 'none',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = '#ec4899'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!placeName.trim()}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: placeName.trim() ? '#ec4899' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: placeName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MapController({ center, navigationMode, mapCenter }) {
  const map = useMap();

  useEffect(() => {
    if (navigationMode && center) {
      map.setView(center, 16);
    }
  }, [center, navigationMode, map]);

  useEffect(() => {
    if (mapCenter) {
      map.setView(mapCenter, map.getZoom());
    }
  }, [mapCenter, map]);

  return null;
}

function MapClickHandler({ likeMode, setPendingLocation, onMapClick }) {
  useMapEvents({
    click(e) {
      if (likeMode) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
    mousemove(e) {
      if (likeMode) {
        setPendingLocation([e.latlng.lat, e.latlng.lng]);
      }
    },
    mouseout() {
      setPendingLocation(null);
    },
  });

  return null;
}

export default function MapsPage({ emergencyLocation, onEmergencyLocationViewed, savedPlaces = [], onAddSavedPlace, onRemoveSavedPlace }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  // const [likedPlaces, setLikedPlaces] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [navigationMode, setNavigationMode] = useState(false);
  const [mapCenter, setMapCenter] = useState([53.3498, -6.2603]);
  const [likeMode, setLikeMode] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingPlacePosition, setPendingPlacePosition] = useState(null);

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(loc);
          setMapCenter(loc);
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  }, []);

  //sos message
  useEffect(() => {
  if (emergencyLocation) {
    setMapCenter([emergencyLocation.lat, emergencyLocation.lng]);
  }
}, [emergencyLocation]);

  // Watch location when tracking is enabled
  useEffect(() => {
    let watchId;

    if (tracking && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(loc);
          setLocationHistory(prev => [...prev, { position: loc, timestamp: Date.now() }]);
        },
        (error) => console.error('Error watching location:', error),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [tracking]);

  const handleMapClick = (position) => {
    setPendingPlacePosition(position);
    setModalOpen(true);
    setLikeMode(false);
    setPendingLocation(null);
  };

  // const handleSavePlace = (placeName) => {
  //   if (pendingPlacePosition) {
  //     setLikedPlaces(prev => [...prev, {
  //       id: Date.now(),
  //       position: pendingPlacePosition,
  //       name: placeName,
  //       timestamp: Date.now()
  //     }]);
  //   }
  //   setModalOpen(false);
  //   setPendingPlacePosition(null);
  // };

  // const handleLikeCurrentLocation = () => {
  //   if (currentLocation) {
  //     setPendingPlacePosition(currentLocation);
  //     setModalOpen(true);
  //   }
  // };

  // const removeLikedPlace = (id) => {
  //   setLikedPlaces(prev => prev.filter(place => place.id !== id));
  // };

  const handleSavePlace = async (placeName) => {
  if (pendingPlacePosition) {
    await onAddSavedPlace(
      placeName,
      pendingPlacePosition[0],
      pendingPlacePosition[1]
    );
  }
  setModalOpen(false);
  setPendingPlacePosition(null);
};

const removeLikedPlace = async (id) => {
  await onRemoveSavedPlace(id);
};

const handleLikeCurrentLocation = () => {
  if (currentLocation) {
    setPendingPlacePosition(currentLocation);
    setModalOpen(true);
  }
};


  const centerOnCurrentLocation = () => {
    if (currentLocation) setMapCenter([...currentLocation]);
  };

  const toggleLikeMode = () => {
    setLikeMode(prev => !prev);
    setPendingLocation(null);
  };

  const clearHistory = () => {
    if (confirm('Clear all location history?')) setLocationHistory([]);
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>

      {/* Custom Modal */}
      <PlaceNameModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPendingPlacePosition(null);
        }}
        onSave={handleSavePlace}
      />

      {/* Like mode instruction banner */}
      {likeMode && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1100,
          backgroundColor: '#ec4899',
          color: 'white',
          padding: '8px 20px',
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          ❤️ marks the spot
        </div>
      )}

      {/* Fullscreen Map */}
     <MapContainer
  center={mapCenter}
  zoom={13}
  style={{ height: '100%', width: '100%', cursor: likeMode ? 'crosshair' : 'grab' }}
>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  <MapController center={currentLocation} navigationMode={navigationMode} mapCenter={mapCenter} />

  <MapClickHandler
    likeMode={likeMode}
    setPendingLocation={setPendingLocation}
    onMapClick={handleMapClick}
  />

  {/* Cursor preview pin */}
  {likeMode && pendingLocation && (
    <Marker position={pendingLocation} icon={pendingLocationIcon} interactive={false} />
  )}

  {/* Current Location Marker */}
  {currentLocation && (
    <Marker position={currentLocation} icon={currentLocationIcon}>
      <Popup>
        <div style={{ fontWeight: 600 }}>You are here</div>
        {navigationMode && <div style={{ fontSize: '0.875rem', color: '#666' }}>Navigation mode active</div>}
        <button
          onClick={handleLikeCurrentLocation}
          style={{
            marginTop: '8px',
            padding: '4px 10px',
            backgroundColor: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AiOutlineHeart size={14} /> Like this spot
        </button>
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
  {/* Saved Places */}
{savedPlaces.map(place => (
  <Marker key={place.id} position={[parseFloat(place.latitude), parseFloat(place.longitude)]} icon={likedLocationIcon}>
    <Popup>
      <div style={{ minWidth: '150px' }}>
        <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
          {place.name}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
          {new Date(place.created_at).toLocaleDateString()}
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
  {/* {likedPlaces.map(place => (
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
  ))} */}

  {/* Emergency Location Marker */}
  {emergencyLocation && (
    <Marker
      position={[emergencyLocation.lat, emergencyLocation.lng]}
      icon={emergencyLocationIcon}
    >
      <Popup>
        <div style={{ minWidth: '150px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: '#ff4757', fontSize: '16px', marginBottom: '4px' }}>
            🚨 Emergency Location
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
            This is where your friend sent their SOS from
          </div>
          <button
            onClick={onEmergencyLocationViewed}
            style={{
              background: '#ff4757',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Dismiss
          </button>
        </div>
      </Popup>
    </Marker>
  )}
</MapContainer>

      {/* Control Buttons - Top Right */}
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
          onClick={toggleLikeMode}
          style={{
            padding: '10px 16px',
            backgroundColor: likeMode ? '#be185d' : '#ec4899',
            color: 'white',
            border: likeMode ? '2px solid white' : '2px solid transparent',
            borderRadius: '8px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: likeMode ? '0 0 0 3px #ec4899' : '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            transition: 'box-shadow 0.2s',
          }}
        >
          <AiOutlineHeart size={16} />
          {likeMode ? 'Cancel Like' : 'Like Place'}
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
        bottom: '80px',
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
          <div>❤️ Liked: {savedPlaces.length}</div>
          <div style={{ color: tracking ? '#22c55e' : '#6b7280', fontWeight: tracking ? 600 : 400 }}>
            {tracking ? '● Tracking' : '○ Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
}