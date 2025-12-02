import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Alert } from 'react-bootstrap';
import L from 'leaflet';
import * as turf from '@turf/turf';
import PropTypes from 'prop-types';
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

// Icon  
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const highlightIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [35, 57], // bigger 40%
  iconAnchor: [17, 57], 
  popupAnchor: [1, -34],
  shadowSize: [57, 57] 
});

// Component to handle map clicks and add markers
function LocationMarker({ markers, setMarkers , geoJsonData , onOutOfBounds,onLocationSelected, readOnly, allReports, onReportMarkerClick, highlightedReportId, selectedLocation }) {
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
          draggable={!readOnly}
          eventHandlers={{
            dblclick: () => handleRemoveMarker(marker.id),
            dragend: (e) => {
              if (readOnly) return;
              const { lat, lng } = e.target.getLatLng();
              setMarkers([{
                id: marker.id,
                position: [lat, lng],
                timestamp: new Date().toLocaleString()
              }]);
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

      {/* Marker di selezione singolo - SOLO in modalità view quando c'è selectedLocation */}
      {readOnly && selectedLocation?.lat && selectedLocation?.lng && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={highlightIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <div>
              <strong>{selectedLocation.title || 'Selected Location'}</strong>
              <br />
              Lat: {selectedLocation.lat.toFixed(5)}
              <br />
              Lng: {selectedLocation.lng.toFixed(5)}
            </div>
          </Popup>
        </Marker>
      )}

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
            let sizeClass = 'marker-cluster-small';

            if (count >= 10) {
              sizeClass = 'marker-cluster-large';
            } else if (count >= 5) {
              sizeClass = 'marker-cluster-medium';
            }

            return L.divIcon({
              html: '<div><span>' + count + '</span></div>',
              className: 'marker-cluster ' + sizeClass,
              iconSize: L.point(40, 40)
            });
          }}
        >
          {allReports.map((report) => {
            if (!report.latitude || !report.longitude) return null;
            const isHighlighted = report.id === highlightedReportId;
        
            // Nascondi il marker del cluster se è evidenziato (viene mostrato come marker ingrandito singolo)
            if (isHighlighted) return null;
            
        return (
          <Marker
            key={`report-${report.id}`}
            position={[report.latitude, report.longitude]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => {
                if (onReportMarkerClick) {
                  onReportMarkerClick(report);
                }
              }
            }}
          >
          <Popup className="report-map-popup">
              <div style={{ minWidth: '220px', maxWidth: '300px' }}>
                <h6 style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1rem', color: '#212529' }}>
                  {report.title}
                </h6>
                {report.category && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#6c757d',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="bi bi-tag me-1 text-primary"></i>
                    {report.category}
                  </div>
                )}
                {report.status && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#6c757d',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="bi bi-info-circle me-1 text-info"></i>
                    Status: <strong style={{ marginLeft: '0.25rem' }}>{report.status}</strong>
                  </div>
                )}
                {report.user && (
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <i className="bi bi-person-circle me-2 text-primary"></i>
                    <span>{report.user.username || report.user.name || 'Anonymous'}</span>
                  </div>
                )}
                {report.description && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#495057',
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #dee2e6',
                    lineHeight: '1.4'
                  }}>
                    {report.description.length > 100 
                      ? `${report.description.substring(0, 100)}...` 
                      : report.description}
                  </div>
                )}
                <div style={{ 
                  marginTop: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #dee2e6',
                  fontSize: '0.75rem',
                  color: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>
                    <i className="bi bi-calendar me-1"></i>
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                  {report.photoUrls && report.photoUrls.length > 0 && (
                    <span style={{ color: '#0d6efd' }}>
                      <i className="bi bi-image me-1"></i>
                      {report.photoUrls.length}
                    </span>
                  )}
                </div>
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

LocationMarker.propTypes = {
  markers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      position: PropTypes.arrayOf(PropTypes.number),
      timestamp: PropTypes.string
    })
  ).isRequired,
  setMarkers: PropTypes.func.isRequired,
  geoJsonData: PropTypes.object,
  onOutOfBounds: PropTypes.func,
  onLocationSelected: PropTypes.func,
  readOnly: PropTypes.bool,
  allReports: PropTypes.array,
  onReportMarkerClick: PropTypes.func,
  highlightedReportId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    title: PropTypes.string
  })
};

export default function TurinMap({ onLocationSelected, selectedLocation, readOnly = false, allReports = [], onReportMarkerClick, highlightedReportId, shouldZoomToSelection = false }) {
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


  // Component to handle map centering and zooming to selected location
  function MapCenterZoom({ selectedLocation, shouldZoom }) {
    const map = useMap();

    useEffect(() => {
      if (selectedLocation?.lat && selectedLocation?.lng && shouldZoom) {
        const currentZoom = map.getZoom();
        const clusterThreshold = 18; // Zoom level dove i cluster si separano
        const targetZoom = 15; // Zoom moderato
        
        // Zoom solo se siamo sotto il livello dove i cluster si separano
        if (currentZoom < clusterThreshold) {
          map.setView([selectedLocation.lat, selectedLocation.lng], targetZoom, {
            animate: true,
            duration: 1
          });
        } else {
          // Se già abbastanza zoomato, centra solo senza cambiare zoom
          map.setView([selectedLocation.lat, selectedLocation.lng], currentZoom, {
            animate: true,
            duration: 0.5
          });
        }
      }
    }, [selectedLocation, shouldZoom, map]);

    return null;
  }

  MapCenterZoom.propTypes = {
    selectedLocation: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      title: PropTypes.string
    }),
    shouldZoom: PropTypes.bool
  };

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
        style={{ 
          height: '100%', 
          width: '100%',
          border: '2px solid #5e7bb3',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {/* Componente per centrare e zoomare sulla posizione selezionata */}
        <MapCenterZoom selectedLocation={selectedLocation} shouldZoom={shouldZoomToSelection} />
        
       {geoJsonData && (
          <GeoJSON 
            data={geoJsonData} 
            style={geoJsonStyle}
          />
        )}
        
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
          highlightedReportId={highlightedReportId}
          selectedLocation={selectedLocation}
        />
      </MapContainer>
    </div>
  );
}

TurinMap.propTypes = {
  onLocationSelected: PropTypes.func,
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    title: PropTypes.string
  }),
  readOnly: PropTypes.bool,
  allReports: PropTypes.array,
  onReportMarkerClick: PropTypes.func,
  highlightedReportId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  shouldZoomToSelection: PropTypes.bool
};

