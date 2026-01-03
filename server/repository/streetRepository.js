const streetDao = require('../dao/streetDao');
const axios = require('axios');

exports.getStreets = async (query) => {
  return await streetDao.searchStreets(query);
};

async function fetchStreetGeometry(streetName) {
  // Query Overpass per ottenere TUTTI i segmenti (way) della strada
  const query = `
    [out:json][timeout:300];
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
        timeout: 30000 // Aumentato a 30 secondi
      }
    );

    if (!response.data || !response.data.elements || response.data.elements.length === 0) {
      console.warn(`Overpass: nessun risultato per ${streetName}, uso fallback Nominatim`);
      return fetchStreetFromNominatim(streetName);
    }

    // 1. Raggruppamento dei segmenti in cluster
    const clusters = [];
    response.data.elements.forEach(way => {
      if (!way.geometry) return;
      const coords = way.geometry.map(node => [node.lon, node.lat]);
      
      let addedToCluster = false;
      const MAX_DISTANCE = 0.001; // ~100 metri

      for (const cluster of clusters) {
        const lastPoint = cluster[cluster.length - 1];
        const firstNewPoint = coords[0];
        
        // Calcolo distanza euclidea semplice
        const dist = Math.sqrt(
          Math.pow(lastPoint[0] - firstNewPoint[0], 2) + 
          Math.pow(lastPoint[1] - firstNewPoint[1], 2)
        );
        
        if (dist < MAX_DISTANCE) {
          cluster.push(...coords);
          addedToCluster = true;
          break;
        }
      }
      if (!addedToCluster) clusters.push(coords);
    });

    if (clusters.length === 0) {
      console.warn(`Nessun cluster valido per ${streetName}, uso fallback Nominatim`);
      return fetchStreetFromNominatim(streetName);
    }

    // 2. Creazione dei buffer per TUTTI i cluster
    const allPolygons = clusters.map(cluster => createLineBuffer(cluster, 0.0014));

    // 3. Calcolo Bounding Box globale (unione di tutti i cluster)
    const allCoords = clusters.flat();
    const lats = allCoords.map(c => c[1]);
    const lons = allCoords.map(c => c[0]);

    const boundingBox = {
      min_lat: Math.min(...lats),
      max_lat: Math.max(...lats),
      min_lon: Math.min(...lons),
      max_lon: Math.max(...lons)
    };

    const center = {
      latitude: (boundingBox.min_lat + boundingBox.max_lat) / 2,
      longitude: (boundingBox.min_lon + boundingBox.max_lon) / 2
    };

    // 4. Restituzione MultiPolygon
    console.log(`✓ Geometria ottenuta per ${streetName}: ${clusters.length} cluster, ${allPolygons.length} poligoni`);
    
    return {
      ...center,
      ...boundingBox,
      geometry: JSON.stringify({
        type: 'MultiPolygon',
        coordinates: allPolygons.map(poly => [poly])
      })
    };

  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
      console.error(`Overpass timeout per ${streetName}, uso fallback Nominatim`);
    } else {
      console.error(`Overpass API error per ${streetName}:`, error.message);
    }
    // Fallback a Nominatim
    return fetchStreetFromNominatim(streetName);
  }
}

/**
 * Fallback: usa Nominatim (meno preciso)
 */
async function fetchStreetFromNominatim(streetName) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        street: streetName,
        city: 'Torino',
        format: 'json',
        limit: 1
      },
      headers: { 'User-Agent': 'TorinoReportsApp/1.0' },
      timeout: 10000
    });

    if (response.data.length === 0) {
      throw new Error('Street not found');
    }

    const geo = response.data[0];
    const bbox = geo.boundingbox || [];
    
    // Aumenta il buffer per le strade lunghe (da 0.001 a 0.005 = ~500m)
    const bufferSize = 0.005;
    
    const result = {
      latitude: Number.parseFloat(geo.lat),
      longitude: Number.parseFloat(geo.lon),
      min_lat: bbox[0] ? Number.parseFloat(bbox[0]) : Number.parseFloat(geo.lat) - bufferSize,
      max_lat: bbox[1] ? Number.parseFloat(bbox[1]) : Number.parseFloat(geo.lat) + bufferSize,
      min_lon: bbox[2] ? Number.parseFloat(bbox[2]) : Number.parseFloat(geo.lon) - bufferSize,
      max_lon: bbox[3] ? Number.parseFloat(bbox[3]) : Number.parseFloat(geo.lon) + bufferSize
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

    console.log(`✓ Geometria da Nominatim per ${streetName} (bounding box esteso)`);
    console.log(`  BBox: [${result.min_lat}, ${result.max_lat}] x [${result.min_lon}, ${result.max_lon}]`);
    return result;
    
  } catch (error) {
    console.error(`Nominatim error per ${streetName}:`, error.message);
    throw new Error(`Street not found: ${streetName}`);
  }
}

/**
 * Crea un buffer poligonale attorno a una linea
 * @param {Array} lineCoords - Array di [lon, lat]
 * @param {number} bufferDegrees - Distanza del buffer in gradi (~0.0014 = 140m)
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
 * Verifica se un punto è dentro un poligono o multipoligono
 */
function isPointInPolygon(lat, lon, geometryJson) {
  try {
    const geometry = JSON.parse(geometryJson);
    
    // Gestisci sia Polygon che MultiPolygon
    if (geometry.type === 'MultiPolygon') {
      // Per MultiPolygon, controlla se il punto è in ALMENO uno dei poligoni
      return geometry.coordinates.some(polygonRings => {
        const outerRing = polygonRings[0]; // Primo anello = contorno esterno
        return raycastCheck(lat, lon, outerRing);
      });
    } else if (geometry.type === 'Polygon') {
      const outerRing = geometry.coordinates[0];
      return raycastCheck(lat, lon, outerRing);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking point in polygon:', error);
    return false;
  }
}

/**
 * Ray casting algorithm per verificare se un punto è dentro un poligono
 */
function raycastCheck(lat, lon, ring) {
  // Filtra punti invalidi
  const validRing = ring.filter(point => 
    point && 
    point[0] !== null && 
    point[1] !== null &&
    !Number.isNaN(point[0]) && 
    !Number.isNaN(point[1])
  );
  
  if (validRing.length < 3) {
    console.warn('Anello invalido, troppo pochi punti validi');
    return false;
  }
  
  let inside = false;
  for (let i = 0, j = validRing.length - 1; i < validRing.length; j = i++) {
    const xi = validRing[i][0], yi = validRing[i][1];
    const xj = validRing[j][0], yj = validRing[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat))
      && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
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
  console.log(`\n=== Filtering per ${street.street_name} ===`);
  console.log(`Total reports to check: ${reports.length}`);
  console.log(`BBox: [${street.min_lat}, ${street.max_lat}] x [${street.min_lon}, ${street.max_lon}]`);
  
  // Filtro base con bounding box
  const inBBox = reports.filter(r => {
    const inBox = r.latitude >= street.min_lat &&
                  r.latitude <= street.max_lat &&
                  r.longitude >= street.min_lon &&
                  r.longitude <= street.max_lon;
    
    if (!inBox) {
      console.log(`  ✗ Report ${r.id} at [${r.latitude}, ${r.longitude}] FUORI dal bounding box`);
    } else {
      console.log(`  ✓ Report ${r.id} at [${r.latitude}, ${r.longitude}] DENTRO bounding box`);
    }
    return inBox;
  });

  console.log(`Reports in bounding box: ${inBBox.length}`);

  // Se non c'è geometria, usa solo il bounding box
  if (!street.geometry) {
    console.warn(`⚠ Geometria mancante per ${street.street_name} - uso solo bounding box`);
    return inBBox;
  }

  try {
    const geometry = JSON.parse(street.geometry);
    console.log(`Geometry type: ${geometry.type}`);
    
    // Filtro geometrico preciso usando isPointInPolygon
    const filtered = inBBox.filter(r => {
      const isInside = isPointInPolygon(r.latitude, r.longitude, street.geometry);
      console.log(`  ${isInside ? '✓' : '✗'} Report ${r.id} è ${isInside ? 'DENTRO' : 'FUORI'} il poligono`);
      return isInside;
    });
    
    console.log(`✓ ${street.street_name}: ${filtered.length}/${inBBox.length} reports dopo filtro geometrico\n`);
    return filtered;
    
  } catch (error) {
    console.error(`Errore parsing geometria per ${street.street_name}:`, error.message);
    return inBBox; // Fallback al bounding box
  }
};