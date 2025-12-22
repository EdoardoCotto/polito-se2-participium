"use strict";

// Unit tests for server/repository/streetRepository.js

describe('streetRepository', () => {
  const axiosMock = { post: jest.fn(), get: jest.fn() };
  const daoMock = {
    searchStreets: jest.fn(),
    getStreetByName: jest.fn(),
    updateStreetGeocoding: jest.fn(),
  };

  const loadRepo = () => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock('axios', () => axiosMock);
    jest.doMock('../../server/dao/streetDao', () => daoMock);
    return require('../../server/repository/streetRepository');
  };

  test('getStreets delegates to DAO', async () => {
    const repo = loadRepo();
    const rows = [{ street_name: 'A' }];
    daoMock.searchStreets.mockResolvedValueOnce(rows);
    const res = await repo.getStreets('A');
    expect(daoMock.searchStreets).toHaveBeenCalledWith('A');
    expect(res).toBe(rows);
  });

  test('getStreetDetailsAndReports: fetch geometry via Overpass clusters', async () => {
    const repo = loadRepo();
    daoMock.getStreetByName.mockResolvedValueOnce({ id: 1, street_name: 'Via Roma' });
    // Overpass returns one way with two geometry points
    axiosMock.post.mockResolvedValueOnce({
      data: {
        elements: [
          { geometry: [ { lon: 7.68, lat: 45.07 }, { lon: 7.681, lat: 45.071 } ] }
        ]
      }
    });
    const out = await repo.getStreetDetailsAndReports('Via Roma');
    expect(daoMock.updateStreetGeocoding).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ geometry: expect.any(String), latitude: expect.any(Number), longitude: expect.any(Number) })
    );
    const arg = daoMock.updateStreetGeocoding.mock.calls[0][1];
    const geom = JSON.parse(arg.geometry);
    expect(geom.type).toBe('MultiPolygon');
    expect(out.street_name).toBe('Via Roma');
    expect(out.latitude).toBeDefined();
    expect(out.longitude).toBeDefined();
  });

  test('getStreetDetailsAndReports: Overpass merges close ways into one cluster', async () => {
    const repo = loadRepo();
    daoMock.getStreetByName.mockResolvedValueOnce({ id: 5, street_name: 'Via Merge' });
    // Two ways whose endpoints are within MAX_DISTANCE, triggering merge
    axiosMock.post.mockResolvedValueOnce({
      data: {
        elements: [
          { geometry: [ { lon: 7.0000, lat: 45.0000 }, { lon: 7.0005, lat: 45.0005 } ] },
          { geometry: [ { lon: 7.0006, lat: 45.0006 }, { lon: 7.0010, lat: 45.0010 } ] }
        ]
      }
    });
    const out = await repo.getStreetDetailsAndReports('Via Merge');
    const geom = JSON.parse(out.geometry);
    expect(geom.type).toBe('MultiPolygon');
    // Merged into a single cluster -> one polygon in multipolygon
    expect(geom.coordinates.length).toBe(1);
    expect(daoMock.updateStreetGeocoding).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ geometry: expect.any(String), latitude: expect.any(Number), longitude: expect.any(Number) })
    );
  });

  test('getStreetDetailsAndReports: elements present but no geometry -> Nominatim fallback', async () => {
    const repo = loadRepo();
    daoMock.getStreetByName.mockResolvedValueOnce({ id: 6, street_name: 'Via EmptyGeo' });
    axiosMock.post.mockResolvedValueOnce({ data: { elements: [{}, {}] } });
    axiosMock.get.mockResolvedValueOnce({
      data: [ { lat: '45.10', lon: '7.60', boundingbox: ['45.09','45.11','7.59','7.61'] } ]
    });
    const out = await repo.getStreetDetailsAndReports('Via EmptyGeo');
    expect(daoMock.updateStreetGeocoding).toHaveBeenCalledWith(
      6,
      expect.objectContaining({ geometry: expect.any(String) })
    );
    const geom = JSON.parse(daoMock.updateStreetGeocoding.mock.calls[0][1].geometry);
    expect(geom.type).toBe('Polygon');
    expect(out.latitude).toBeCloseTo(45.10, 2);
    expect(out.longitude).toBeCloseTo(7.60, 2);
  });

  test('getStreetDetailsAndReports: Overpass API error -> Nominatim fallback', async () => {
    const repo = loadRepo();
    daoMock.getStreetByName.mockResolvedValueOnce({ id: 7, street_name: 'Via API Error' });
    axiosMock.post.mockRejectedValueOnce({ response: { status: 400 }, message: 'bad' });
    axiosMock.get.mockResolvedValueOnce({
      data: [ { lat: '45.12', lon: '7.62', boundingbox: ['45.11','45.13','7.61','7.63'] } ]
    });
    const out = await repo.getStreetDetailsAndReports('Via API Error');
    expect(daoMock.updateStreetGeocoding).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ geometry: expect.any(String) })
    );
    expect(out.max_lat).toBeGreaterThan(out.min_lat);
  });

  test('getStreetDetailsAndReports: Overpass no elements -> Nominatim fallback', async () => {
    const repo = loadRepo();
    daoMock.getStreetByName.mockResolvedValueOnce({ id: 2, street_name: 'Via Po' });
    axiosMock.post.mockResolvedValueOnce({ data: { elements: [] } });
    axiosMock.get.mockResolvedValueOnce({
      data: [ { lat: '45.07', lon: '7.69', boundingbox: ['45.06','45.08','7.68','7.70'] } ]
    });
    const out = await repo.getStreetDetailsAndReports('Via Po');
    expect(daoMock.updateStreetGeocoding).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ geometry: expect.any(String) })
    );
    const arg = daoMock.updateStreetGeocoding.mock.calls[0][1];
    const geom = JSON.parse(arg.geometry);
    expect(geom.type).toBe('Polygon');
    expect(out.latitude).toBeDefined();
  });

  test('getStreetDetailsAndReports: Overpass timeout -> Nominatim fallback', async () => {
    const repo = loadRepo();
    daoMock.getStreetByName.mockResolvedValueOnce({ id: 3, street_name: 'Corso Francia' });
    axiosMock.post.mockRejectedValueOnce({ code: 'ECONNABORTED' });
    axiosMock.get.mockResolvedValueOnce({
      data: [ { lat: '45.08', lon: '7.64', boundingbox: ['45.07','45.09','7.63','7.65'] } ]
    });
    const out = await repo.getStreetDetailsAndReports('Corso Francia');
    expect(daoMock.updateStreetGeocoding).toHaveBeenCalled();
    expect(out.max_lat).toBeGreaterThan(out.min_lat);
  });

  test('getStreetDetailsAndReports: Nominatim empty -> throws', async () => {
    const repo = loadRepo();
    daoMock.getStreetByName.mockResolvedValueOnce({ id: 4, street_name: 'Strada Fake' });
    axiosMock.post.mockResolvedValueOnce({ data: { elements: [] } });
    axiosMock.get.mockResolvedValueOnce({ data: [] });
    await expect(repo.getStreetDetailsAndReports('Strada Fake')).rejects.toThrow('Street not found');
    expect(daoMock.updateStreetGeocoding).not.toHaveBeenCalled();
  });

  test('getStreetDetailsAndReports: street not found in DB -> throws', async () => {
    const repo = loadRepo();
    daoMock.getStreetByName.mockResolvedValueOnce(null);
    await expect(repo.getStreetDetailsAndReports('No Street')).rejects.toThrow('Street not found');
  });

  test('filterReportsOnStreet: bounding box only', () => {
    const repo = loadRepo();
    const reports = [
      { id: 1, latitude: 45.07, longitude: 7.68 },
      { id: 2, latitude: 45.2, longitude: 7.9 }, // outside
    ];
    const street = { street_name: 'Via Test', min_lat: 45.06, max_lat: 45.08, min_lon: 7.67, max_lon: 7.69 };
    const filtered = repo.filterReportsOnStreet(reports, street);
    expect(filtered.map(r => r.id)).toEqual([1]);
  });

  test('filterReportsOnStreet: valid MultiPolygon filter', () => {
    const repo = loadRepo();
    const poly = [
      [7.67,45.06],[7.69,45.06],[7.69,45.08],[7.67,45.08],[7.67,45.06]
    ];
    const street = {
      street_name: 'Via Poly',
      min_lat: 45.06, max_lat: 45.08, min_lon: 7.67, max_lon: 7.69,
      geometry: JSON.stringify({ type:'MultiPolygon', coordinates: [[poly]] })
    };
    const reports = [
      { id: 10, latitude: 45.07, longitude: 7.68 }, // inside
      { id: 11, latitude: 45.07, longitude: 7.70 }, // in bbox but outside polygon
    ];
    const filtered = repo.filterReportsOnStreet(reports, street);
    expect(filtered.map(r => r.id)).toEqual([10]);
  });

  test('filterReportsOnStreet: Polygon geometry filter works', () => {
    const repo = loadRepo();
    const street = {
      street_name: 'Via Box',
      min_lat: 45.06, max_lat: 45.08, min_lon: 7.67, max_lon: 7.69,
      geometry: JSON.stringify({
        type: 'Polygon',
        coordinates: [[
          [7.67,45.06],[7.69,45.06],[7.69,45.08],[7.67,45.08],[7.67,45.06]
        ]]
      })
    };
    const reports = [
      { id: 21, latitude: 45.07, longitude: 7.68 }, // inside
      { id: 22, latitude: 45.07, longitude: 7.70 }, // bbox but outside polygon
    ];
    const filtered = repo.filterReportsOnStreet(reports, street);
    expect(filtered.map(r => r.id)).toEqual([21]);
  });

  test('filterReportsOnStreet: unknown geometry type -> returns empty after polygon check', () => {
    const repo = loadRepo();
    const street = {
      street_name: 'Via Unknown',
      min_lat: 45.06, max_lat: 45.08, min_lon: 7.67, max_lon: 7.69,
      geometry: JSON.stringify({ type: 'LineString', coordinates: [[7.67,45.06],[7.69,45.08]] })
    };
    const reports = [
      { id: 23, latitude: 45.07, longitude: 7.68 },
      { id: 24, latitude: 45.07, longitude: 7.68 },
    ];
    const filtered = repo.filterReportsOnStreet(reports, street);
    expect(filtered).toEqual([]);
  });

  test('filterReportsOnStreet: invalid geometry JSON -> fallback to bbox', () => {
    const repo = loadRepo();
    const street = { street_name: 'Via Bad', min_lat: 45.06, max_lat: 45.08, min_lon: 7.67, max_lon: 7.69, geometry: '{not json' };
    const reports = [
      { id: 1, latitude: 45.07, longitude: 7.68 },
      { id: 2, latitude: 46.0, longitude: 8.0 },
    ];
    const filtered = repo.filterReportsOnStreet(reports, street);
    expect(filtered.map(r => r.id)).toEqual([1]);
  });

  test('filterReportsOnStreet: geometry missing -> warn and use bbox', () => {
    const repo = loadRepo();
    const street = { street_name: 'Via Missing', min_lat: 45.06, max_lat: 45.08, min_lon: 7.67, max_lon: 7.69 };
    const reports = [ { id: 1, latitude: 45.07, longitude: 7.68 }, { id: 2, latitude: 45.2, longitude: 7.9 } ];
    const filtered = repo.filterReportsOnStreet(reports, street);
    expect(filtered.map(r => r.id)).toEqual([1]);
  });

  test('filterReportsOnStreet: invalid ring (too few valid points) -> exclude', () => {
    const repo = loadRepo();
    const ring = [ [7.67,45.06], [null,null] ]; // will be filtered to <3 points
    const street = {
      street_name: 'Via Invalid',
      min_lat: 45.06, max_lat: 45.08, min_lon: 7.67, max_lon: 7.69,
      geometry: JSON.stringify({ type:'MultiPolygon', coordinates: [[ring]] })
    };
    const reports = [ { id: 3, latitude: 45.07, longitude: 7.68 } ];
    const filtered = repo.filterReportsOnStreet(reports, street);
    expect(filtered).toEqual([]);
  });
});
