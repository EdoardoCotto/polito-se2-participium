const streetDao = require('../dao/streetDao');
const axios = require('axios');

exports.getStreets = async (query) => {
  return await streetDao.searchStreets(query);
};
// streetRepository.js (corretto)
exports.getStreetDetailsAndReports = async (streetName) => {
  let street = await streetDao.getStreetByName(streetName);
  if (!street) throw new Error("Street not found");

  // Se non abbiamo ancora le coordinate nel DB, le recuperiamo da Nominatim
  if (!street.latitude || !street.longitude) {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        street: street.street_name,
        city: 'Torino',
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'YourAppName/1.0 (your-email@example.com)'
      },
      timeout: 5000
    });

    if (response.data.length > 0) {
      const geo = response.data[0];
      const bbox = geo.boundingbox || []; // normalmente [minlat, maxlat, minlon, maxlon]

      // Normalizziamo i campi in snake_case come si aspetta il controller
      const geoData = {
        latitude: parseFloat(geo.lat),
        longitude: parseFloat(geo.lon),
        min_lat: bbox[0] ? parseFloat(bbox[0]) : undefined,
        max_lat: bbox[1] ? parseFloat(bbox[1]) : undefined,
        min_lon: bbox[2] ? parseFloat(bbox[2]) : undefined,
        max_lon: bbox[3] ? parseFloat(bbox[3]) : undefined
      };

      // Se manca la bbox di Nominatim, creiamo un piccolo bounding box attorno al centro
      if (geoData.min_lat === undefined || geoData.max_lat === undefined ||
          geoData.min_lon === undefined || geoData.max_lon === undefined) {
        const delta = 0.0005; // ~50m, adattalo se vuoi
        geoData.min_lat = geoData.latitude - delta;
        geoData.max_lat = geoData.latitude + delta;
        geoData.min_lon = geoData.longitude - delta;
        geoData.max_lon = geoData.longitude + delta;
      }

      await streetDao.updateStreetGeocoding(street.id, geoData);
      street = { ...street, ...geoData };
    }
  }

  return street;
};
