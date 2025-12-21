const streetDao = require('../dao/streetDao');
const axios = require('axios');

exports.getStreets = async (query) => {
  return await streetDao.searchStreets(query);
};


/**
 * Ottiene la geometria completa di una strada da Overpass API
 * @param {string} streetName - Nome della via
 * @returns {object} Oggetto con geometria e bounding box
 */
async function fetchStreetGeometry(streetName) {
  // Query Overpass per ottenere TUTTI i nodi della strada a Torino
  const query = `
    [out:json][timeout:10];
    area["name"="Torino"]["admin_level"="8"]->.city;
    (
      way["name"="${streetName}"]["highway"](area.city);
    );
    out geom;
  `;

  try {
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(query)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      }
    );

    if (!response.data.elements || response.data.elements.length === 0) {
      throw new Error('Street geometry not found in Overpass');
    }

    // Combina tutti i segmenti della strada (può essere spezzata in più "way")
    const allCoords = [];
    response.data.elements.forEach(way => {
      if (way.geometry) {
        way.geometry.forEach(node => {
          allCoords.push([node.lon, node.lat]);
        });
      }
    });

    if (allCoords.length === 0) {
      throw new Error('No coordinates found for street');
    }

    // Calcola il bounding box dai punti reali
    const lats = allCoords.map(c => c[1]);
    const lons = allCoords.map(c => c[0]);
    
    const boundingBox = {
      min_lat: Math.min(...lats),
      max_lat: Math.max(...lats),
      min_lon: Math.min(...lons),
      max_lon: Math.max(...lons)
    };

    // Calcola il centro (media dei punti)
    const center = {
      latitude: lats.reduce((a, b) => a + b) / lats.length,
      longitude: lons.reduce((a, b) => a + b) / lons.length
    };

    // Crea un buffer poligonale di ~25 metri attorno alla linea
    const bufferedPolygon = createLineBuffer(allCoords, 0.00025); // ~25m

    return {
      ...center,
      ...boundingBox,
      geometry: JSON.stringify({
        type: 'Polygon',
        coordinates: [bufferedPolygon]
      })
    };

  } catch (error) {
    console.error('Overpass API error:', error.message);
    // Fallback a Nominatim se Overpass fallisce
    return fetchStreetFromNominatim(streetName);
  }
}

/**
 * Fallback: usa Nominatim (meno preciso)
 */
async function fetchStreetFromNominatim(streetName) {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      street: streetName,
      city: 'Torino',
      format: 'json',
      limit: 1
    },
    headers: { 'User-Agent': 'TorinoReportsApp/1.0' },
    timeout: 5000
  });

  if (response.data.length === 0) {
    throw new Error('Street not found');
  }

  const geo = response.data[0];
  const bbox = geo.boundingbox || [];
  
  const result = {
    latitude: parseFloat(geo.lat),
    longitude: parseFloat(geo.lon),
    min_lat: bbox[0] ? parseFloat(bbox[0]) : parseFloat(geo.lat) - 0.001,
    max_lat: bbox[1] ? parseFloat(bbox[1]) : parseFloat(geo.lat) + 0.001,
    min_lon: bbox[2] ? parseFloat(bbox[2]) : parseFloat(geo.lon) - 0.001,
    max_lon: bbox[3] ? parseFloat(bbox[3]) : parseFloat(geo.lon) + 0.001
  };

  // Crea un poligono rettangolare dal bounding box
  result.geometry = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [result.min_lon, result.min_lat],
      [result.max_lon, result.min_lat],
      [result.max_lon, result.max_lat],
      [result.min_lon, result.max_lat],
      [result.min_lon, result.min_lat]
    ]]
  });

  return result;
}

/**
 * Crea un buffer poligonale attorno a una linea
 * @param {Array} lineCoords - Array di [lon, lat]
 * @param {number} bufferDegrees - Distanza del buffer in gradi (~0.00025 = 25m)
 * @returns {Array} Coordinate del poligono buffer
 */
function createLineBuffer(lineCoords, bufferDegrees) {
  const leftSide = [];
  const rightSide = [];

  for (let i = 0; i < lineCoords.length - 1; i++) {
    const [x1, y1] = lineCoords[i];
    const [x2, y2] = lineCoords[i + 1];

    // Calcola il vettore perpendicolare normalizzato
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len * bufferDegrees;
    const perpY = dx / len * bufferDegrees;

    // Punti sul lato sinistro e destro
    leftSide.push([x1 + perpX, y1 + perpY]);
    rightSide.push([x1 - perpX, y1 - perpY]);
  }

  // Aggiungi l'ultimo punto
  const [xLast, yLast] = lineCoords[lineCoords.length - 1];
  const [xPrev, yPrev] = lineCoords[lineCoords.length - 2];
  const dx = xLast - xPrev;
  const dy = yLast - yPrev;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / len * bufferDegrees;
  const perpY = dx / len * bufferDegrees;

  leftSide.push([xLast + perpX, yLast + perpY]);
  rightSide.push([xLast - perpX, yLast - perpY]);

  // Unisci i lati per formare il poligono chiuso
  return [...leftSide, ...rightSide.reverse(), leftSide[0]];
}

/**
 * Verifica se un punto è dentro un poligono (Ray Casting Algorithm)
 * @param {number} lat - Latitudine del punto
 * @param {number} lon - Longitudine del punto
 * @param {string} geometryJson - GeoJSON del poligono
 * @returns {boolean}
 */
function isPointInPolygon(lat, lon, geometryJson) {
  try {
    const geometry = JSON.parse(geometryJson);
    const polygon = geometry.coordinates[0];
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat))
        && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  } catch (error) {
    console.error('Error checking point in polygon:', error);
    return false;
  }
}

/**
 * Ottiene i dettagli della strada con geometria completa
 */
exports.getStreetDetailsAndReports = async (streetName) => {
  let street = await streetDao.getStreetByName(streetName);
  
  if (!street) {
    throw new Error('Street not found');
  }

  // Se non abbiamo la geometria, la recuperiamo
  if (!street.geometry || !street.latitude) {
    const geoData = await fetchStreetGeometry(streetName);
    await streetDao.updateStreetGeocoding(street.id, geoData);
    street = { ...street, ...geoData };
  }

  return street;
};

/**
 * Filtra i report che cadono effettivamente sulla strada
 */
exports.filterReportsOnStreet = (reports, street) => {
  if (!street.geometry) {
    // Fallback: usa solo il bounding box
    return reports.filter(r => 
      r.latitude >= street.min_lat &&
      r.latitude <= street.max_lat &&
      r.longitude >= street.min_lon &&
      r.longitude <= street.max_lon
    );
  }

  // Metodo preciso: check point-in-polygon
  return reports.filter(r => 
    isPointInPolygon(r.latitude, r.longitude, street.geometry)
  );
};

module.exports = exports;