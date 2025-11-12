// __tests__/report.repository.test.js
jest.mock('../../server/dao/reportDao', () => ({
  createReport: jest.fn(),
  getReportById: jest.fn(),
}));

const repo = require('../../server/repository/reportRepository');
const dao = require('../../server/dao/reportDao');

describe('reportRepository.createReport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('valida e chiama dao, ritorna DTO corretto', async () => {
    dao.createReport.mockResolvedValue({
      id: 10, userId: 1, latitude: 45, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', status: 'OPEN', created_at: '2025-01-01', updated_at: '2025-01-01',
      image_path1: '/static/uploads/a.jpg', image_path2: null, image_path3: null,
    });

    const out = await repo.createReport({
      userId: 1, latitude: 45, longitude: 7, title: '  T  ', description: ' D ',
      category: 'Public Lighting', photos: ['/static/uploads/a.jpg'],
    });

    expect(dao.createReport).toHaveBeenCalledWith(expect.objectContaining({
      title: 'T', description: 'D',
    }));
    expect(out.photos).toEqual(['/static/uploads/a.jpg']);
  });

  it('errore se photos vuoto', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: 45, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', photos: [],
    })).rejects.toThrow(/Photos array must contain between 1 and 3 items/i);
  });

  it('errore se userId mancante o falsy', async () => {
    await expect(repo.createReport({
      // userId assente
      latitude: 45, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/User ID, latitude, and longitude are required/i);

    await expect(repo.createReport({
      userId: 0, // falsy
      latitude: 45, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/User ID, latitude, and longitude are required/i);
  });

  it('errore se latitude è undefined', async () => {
    await expect(repo.createReport({
      userId: 1, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/User ID, latitude, and longitude are required/i);
  });

  it('errore se longitude è undefined', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: 45, title: 'T', description: 'D',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/User ID, latitude, and longitude are required/i);
  });

  it('errore se categoria invalida', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: 45, longitude: 7, title: 'T', description: 'D',
      category: 'INVALID', photos: ['/x.jpg'],
    })).rejects.toThrow(/Category is invalid/i);
  });

  it('errore se lat/lon fuori range', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: -200, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/Latitude must be a number between -90 and 90/i);
  });

  it('errore se longitude fuori range', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: 45, longitude: 200, title: 'T', description: 'D',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/Longitude must be a number between -180 and 180/i);
  });

  it('errore se title vuoto/blank', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: 45, longitude: 7, title: '   ', description: 'D',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/Title is required/i);
  });

  it('errore se description vuota/blank', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: 45, longitude: 7, title: 'T', description: '   ',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/Description is required/i);
  });

  it('errore se photos non è un array', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: 45, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', photos: 'not-an-array',
    })).rejects.toThrow(/Photos must be an array/i);
  });

  it('errore se una photo è stringa vuota', async () => {
    await expect(repo.createReport({
      userId: 1, latitude: 45, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', photos: ['   '],
    })).rejects.toThrow(/Each photo must be a non-empty string/i);
  });

  it('errore se il dao ritorna un risultato falsy', async () => {
    dao.createReport.mockResolvedValue(undefined);
    await expect(repo.createReport({
      userId: 1, latitude: 45, longitude: 7, title: 'T', description: 'D',
      category: 'Public Lighting', photos: ['/x.jpg'],
    })).rejects.toThrow(/Unable to create report/i);
  });
});

describe('reportRepository.getReportById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('errore se reportId mancante o falsy', async () => {
    await expect(repo.getReportById(undefined)).rejects.toThrow(/Report ID is required/i);
  });

  it('errore se report non trovato', async () => {
    dao.getReportById.mockResolvedValue(undefined);
    await expect(repo.getReportById(999)).rejects.toThrow(/Report not found/i);
  });

  it('ritorna DTO aggregato con photos', async () => {
    dao.getReportById.mockResolvedValue({
      id: 7,
      userId: 2,
      latitude: 1,
      longitude: 2,
      title: 'T',
      description: 'D',
      category: 'Public Lighting',
      status: 'OPEN',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      image_path1: '/p1.jpg',
      image_path2: null,
      image_path3: '/p3.jpg',
    });

    const out = await repo.getReportById(7);
    expect(out).toEqual(expect.objectContaining({ id: 7, photos: ['/p1.jpg', '/p3.jpg'] }));
  });
});