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
