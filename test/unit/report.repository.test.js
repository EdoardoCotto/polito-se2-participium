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
});