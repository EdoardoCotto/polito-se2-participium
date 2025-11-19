import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Button, Alert } from 'react-bootstrap';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import './styles/cluster.css';

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
function LocationMarker({ markers, setMarkers , geoJsonData , onOutOfBounds,onLocationSelected, readOnly, allReports, onReportMarkerClick }) {
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
      // Don't allow clicks if in read-only mode
      if (readOnly) return;

      const { lat, lng } = e.latlng;
      
      // Check if point is inside boundary
      if (!isPointInsideBoundary(lat, lng)) {
        onOutOfBounds();
        return;
      }
      const newMarker = {
        id: Date.now(),
        position: [e.latlng.lat, e.latlng.lng],
        timestamp: new Date().toLocaleString()
      };
      setMarkers([newMarker]);
      if (typeof onLocationSelected === 'function') {
        onLocationSelected({ lat, lng });
      }
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
    // Don't allow removal if in read-only mode
    if (readOnly) return;
    setMarkers(markers.filter(marker => marker.id !== markerId));
    
  };

  return (
    <>
    {/* User-created markers (for creating new reports) - NOT clustered - Only in create mode */}
      {!readOnly && markers.map((marker) => (
       <Marker
          key={marker.id}
          position={marker.position}
          draggable={!readOnly} // Disable dragging in read-only mode
          eventHandlers={{
            dblclick: () => handleRemoveMarker(marker.id),
            dragend: (e) => {
              if (readOnly) return; // Don't allow drag in read-only mode
              const { lat, lng } = e.target.getLatLng();

              //update marker position
              setMarkers([{
                id: marker.id,
                position: [lat, lng],
                timestamp: new Date().toLocaleString()
              }]);

              // update parent (CitizenPage)
              if (onLocationSelected) {
                onLocationSelected({ lat, lng });
              }
            }
          }}
        >

          <Popup>
            <div>
              <strong>New Marker</strong>
              <br />
              Lat: {marker.position[0].toFixed(5)}
              <br />
              Lng: {marker.position[1].toFixed(5)}
              <br />
              <small>{marker.timestamp}</small>
              {!readOnly && (
                <>
                  <br />
                  <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    Double-click on the marker to remove it
                  </small>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Report markers (from API) - Clustered */}
       {allReports && allReports.length > 0 && (
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          disableClusteringAtZoom={18}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            let className = 'marker-cluster-small';

            if (count >= 10) {
              className = 'marker-cluster-large';
            } else if (count >= 5) {
              className = 'marker-cluster-medium';
            }

            return L.divIcon({
              html: `<div><span>${count}</span></div>`,
              className: `marker-cluster ${className}`,
              iconSize: L.point(40, 40)
            });
          }}
        >
          {allReports.map((report) => {
            if (!report.latitude || !report.longitude) return null;
        
        return (
          <Marker
            key={`report-${report.id}`}
            position={[report.latitude, report.longitude]}
            eventHandlers={{
              click: () => {
                if (onReportMarkerClick) {
                  onReportMarkerClick(report);
                }
              }
            }}
          >
          <Popup>
              <div style={{ minWidth: '150px' }}>
                <h6 style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1rem' }}>
                  {report.title}
                </h6>
                {report.user && (
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="bi bi-person-circle me-2"></i>
                    <span>{report.user.username || report.user.name}</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
           );
      })}
      </MarkerClusterGroup>
      )}
    </>
  );
}

export default function TurinMap({ onLocationSelected,selectedLocation, readOnly=false,allReports = [], onReportMarkerClick  }) {
  // Turin coordinates
  const turinPosition = [45.0703, 7.6869];
  const [mapKey, setMapKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [geoJsonError, setGeoJsonError] = useState(false);
  const [showOutOfBoundsAlert, setShowOutOfBoundsAlert] = useState(false);

  // Add debug log to see received reports
  useEffect(() => {
    console.log('TurinMap - Received reports:', allReports?.length);
    console.log('TurinMap - Reports data:', allReports);
  }, [allReports]);


  useEffect(() => {
    if (selectedLocation === null) {
      setMarkers([]);
    }else if (selectedLocation?.lat && selectedLocation?.lng) {
      // Create marker from selectedLocation
      setMarkers([{
        id: selectedLocation.reportId || Date.now(),
        position: [selectedLocation.lat, selectedLocation.lng],
        timestamp: new Date().toLocaleString(),
        title: selectedLocation.title || 'Selected Location'
      }]);
    }
  }, [selectedLocation]);
  
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
    if (readOnly) return; // Don't show alert in read-only mode
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
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <p>Loading map...</p>
      </div>
    );
  }
  
  return (
    <div style={{ height: '100%', width: '100%' }}>
      {/* Out of bounds alert */}
      {!readOnly && showOutOfBoundsAlert && (
        <Alert 
          variant="warning" 
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            margin: 0,
            boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.2)',
            fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
            padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            maxWidth: '90%',
            textAlign: 'center'
          }}
        >
          <strong>Warning:</strong> <span className="d-none d-sm-inline">Markers can only be placed within Turin city boundaries</span>
          <span className="d-inline d-sm-none">Must be within city boundaries</span>
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
        <LocationMarker 
          markers={markers} 
          setMarkers={setMarkers} 
          geoJsonData={geoJsonData}
          onOutOfBounds={handleOutOfBounds}
          onLocationSelected={onLocationSelected}
          readOnly={readOnly} 
          allReports={allReports}
          onReportMarkerClick={onReportMarkerClick}
        />
      </MapContainer>
    </div>
  );
}

