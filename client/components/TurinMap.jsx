import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON } from 'react-leaflet';
import { Button, Alert } from 'react-bootstrap';
import L from 'leaflet';
import * as turf from '@turf/turf';

// Fix for default marker icons in react-leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}


// Component to handle map clicks and add markers
function LocationMarker({ markers, setMarkers , geoJsonData , onOutOfBounds}) {
   const isPointInsideBoundary = (lat, lng) => {
    if (!geoJsonData) return true; // Se non ci sono confini, permetti tutto
    
    const point = turf.point([lng, lat]);
    
    // Controlla tutte le geometrie nel GeoJSON
    if (geoJsonData.type === 'FeatureCollection') {
      return geoJsonData.features.some(feature => {
        try {
          return turf.booleanPointInPolygon(point, feature);
        } catch (error) {
          console.error('Error checking point in polygon:', error);
          return false;
        }
      });
    } else if (geoJsonData.type === 'Feature') {
      try {
        return turf.booleanPointInPolygon(point, geoJsonData);
      } catch (error) {
        console.error('Error checking point in polygon:', error);
        return false;
      }
    }
    
    return false;
  };
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      
      // Controlla se il punto è dentro i confini
      if (!isPointInsideBoundary(lat, lng)) {
        onOutOfBounds();
        return;
      }
      const newMarker = {
        id: Date.now(),
        position: [e.latlng.lat, e.latlng.lng],
        timestamp: new Date().toLocaleString()
      };
      setMarkers([...markers, newMarker]);
    },
  });
  // Cleanup markers that are no longer in state
  useEffect(() => {
    // Remove all layers that are not TileLayer or GeoJSON
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && !markers.find(m => m.position[0] === layer.getLatLng().lat && m.position[1] === layer.getLatLng().lng)) {
        map.removeLayer(layer);
      }
    });
  }, [map, markers]);

  const handleRemoveMarker = (markerId) => {
    setMarkers(markers.filter(marker => marker.id !== markerId));
  };
  console.log("markers:", markers);
  

  return (
    <>
      {markers.map((marker) => (
        <Marker key={marker.id} position={marker.position}
        eventHandlers={{
            dblclick: () => {
              handleRemoveMarker(marker.id);
            }
          }}>
          <Popup>
            <div>
              <strong>New Marker</strong>
              <br />
              Lat: {marker.position[0].toFixed(5)}
              <br />
              Lng: {marker.position[1].toFixed(5)}
              <br />
              <small>{marker.timestamp}</small>
              <br />
               <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                Double-click on the marker to remove it
              </small>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function TurinMap({ height = '500px' }) {
  // Turin coordinates
  const turinPosition = [45.0703, 7.6869];
  const [mapKey, setMapKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [geoJsonError, setGeoJsonError] = useState(false);
  const [showOutOfBoundsAlert, setShowOutOfBoundsAlert] = useState(false);
  
  useEffect(() => {
    setMapKey(1);
    
    const loadGeoJson = async () => {
      try {
        const response = await fetch('/export.geojson');
        if (!response.ok) {
          throw new Error('Failed to load GeoJSON');
        }
        const data = await response.json();
        setGeoJsonData(data);
        setGeoJsonError(false);
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
        setGeoJsonError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGeoJson();
  }, []);
  
  const handleOutOfBounds = () => {
    setShowOutOfBoundsAlert(true);
    setTimeout(() => {
      setShowOutOfBoundsAlert(false);
    }, 3000);
  };
  
  // Style for the GeoJSON boundary
  const geoJsonStyle = {
    color: '#0d6efd',
    weight: 3,
    opacity: 0.8,
    fillColor: '#0d6efd',
    fillOpacity: 0.1
  };
  
  
  if (isLoading) {
    return (
      <div style={{ height: height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <p>Loading map...</p>
      </div>
    );
  }
  
  return (
    <div style={{ height: height, width: '100%' }}>
      {/* Out of bounds alert */}
      {showOutOfBoundsAlert && (
        <Alert 
          variant="warning" 
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            margin: 0,
            boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.2)'
          }}
        >
          <strong>Warning:</strong> Markers can only be placed within Turin city boundaries
        </Alert>
      )}
      <MapContainer 
        key={mapKey}
        center={turinPosition} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
       {/* Render GeoJSON boundary if loaded */}
        {geoJsonData && (
          <GeoJSON 
            data={geoJsonData} 
            style={geoJsonStyle}
          />
        )}
        
        {/* Show error message if GeoJSON failed to load */}
        {geoJsonError && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: '#fff3cd',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            border: '1px solid #ffc107'
          }}>
            <small>Could not load city boundaries</small>
          </div>
        )}
        <LocationMarker markers={markers} setMarkers={setMarkers} geoJsonData={geoJsonData}
          onOutOfBounds={handleOutOfBounds}/>
      </MapContainer>
    </div>
  );
}

