// __tests__/report.controller.test.js
jest.mock('../../server/repository/reportRepository', () => ({
  createReport: jest.fn(),
  getReportById: jest.fn(),
}));

const controller = require('../../server/controller/reportController');
const repo = require('../../server/repository/reportRepository');

const mkRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('reportController.createReport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 con req.files (multipart)', async () => {
    const req = {
      user: { id: 1 },
      body: { title: 'T', description: 'D', category: 'Public Lighting', latitude: '45', longitude: '7' },
      files: [{ filename: 'x.jpg' }, { filename: 'y.png' }],
    };
    const res = mkRes();
    repo.createReport.mockResolvedValue({ id: 1, photos: ['/static/uploads/x.jpg', '/static/uploads/y.png'] });

    await controller.createReport(req, res);

    expect(repo.createReport).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      latitude: 45,
      longitude: 7,
      photos: ['/static/uploads/x.jpg', '/static/uploads/y.png'],
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('400 se nessuna foto', async () => {
    const req = {
      user: { id: 1 },
      body: { title: 'T', description: 'D', category: 'Public Lighting', latitude: '45', longitude: '7' },
      files: [],
    };
    const res = mkRes();
    await controller.createReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/At least one photo/i) }));
  });

  it('401 se non autenticato', async () => {
    const req = { user: null, body: {} };
    const res = mkRes();
    await controller.createReport(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

 it('400 se errore stile multer nel catch (Invalid file type)', async () => {
  const req = {
    user: { id: 1 },
    body: { title: 'T', description: 'D', category: 'Public Lighting', latitude: '45', longitude: '7' },
    files: [{ filename: 'x.jpg' }], // almeno un "file" così non scatta il check "At least one photo"
  };
  const res = mkRes();

  // Simula un errore come quello che arriverebbe da multer/fileFilter
  repo.createReport.mockImplementation(() => {
    throw new Error('Invalid file type, only images are allowed');
  });

  await controller.createReport(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    error: expect.stringMatching(/Invalid file type/i),
  });
});

});

