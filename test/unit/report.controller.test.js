// __tests__/report.controller.test.js
jest.mock('../../server/repository/reportRepository', () => ({
  createReport: jest.fn(),
  getReportById: jest.fn(),
  getPendingReports: jest.fn(),
  getApprovedReports: jest.fn(),
  reviewReport: jest.fn(),
}));

const controller = require('../../server/controller/reportController');
const repo = require('../../server/repository/reportRepository');
const AppError = require('../../server/errors/AppError');

const mkRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

//
// ──────────────────────────────────────────────
//   TEST createReport
// ──────────────────────────────────────────────
//
describe('reportController.createReport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 con req.files (multipart)', async () => {
    const req = {
      user: { id: 1 },
      body: { title: 'T', description: 'D', category: 'Public Lighting', latitude: '45', longitude: '7' },
      files: [{ filename: 'x.jpg' }, { filename: 'y.png' }],
    };
    const res = mkRes();

    repo.createReport.mockResolvedValue({
      id: 1,
      photos: ['/static/uploads/x.jpg', '/static/uploads/y.png']
    });

    await controller.createReport(req, res);

    expect(repo.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        latitude: 45,
        longitude: 7,
        photos: ['/static/uploads/x.jpg', '/static/uploads/y.png'],
      }),
      undefined // secondo argomento = anonymous
    );

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
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/At least one photo/i) })
    );
  });

  it('401 se non autenticato', async () => {
    const req = { user: null, body: {} };
    const res = mkRes();

    await controller.createReport(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('401 se user presente ma senza id', async () => {
    const req = { user: {}, body: {} };
    const res = mkRes();

    await controller.createReport(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('400 se errore Invalid file type', async () => {
    const req = {
      user: { id: 1 },
      body: { title: 'T', description: 'D', category: 'Public Lighting', latitude: '45', longitude: '7' },
      files: [{ filename: 'x.jpg' }],
    };
    const res = mkRes();

    repo.createReport.mockImplementation(() => {
      throw new Error('Invalid file type, only images are allowed');
    });

    await controller.createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringMatching(/Invalid file type/i),
    });
  });

  it('201 con body JSON photos come array', async () => {
    const req = {
      user: { id: 2 },
      body: {
        title: 'T',
        description: 'D',
        category: 'Roads',
        latitude: '45.1',
        longitude: '7.2',
        photos: ['http://a/img1.jpg', 'http://a/img2.png'],
      },
    };
    const res = mkRes();

    repo.createReport.mockResolvedValue({ id: 22, photos: req.body.photos });

    await controller.createReport(req, res);

    expect(repo.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        latitude: 45.1,
        longitude: 7.2,
        photos: ['http://a/img1.jpg', 'http://a/img2.png'],
      }),
      undefined
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('201 con body JSON photos come stringa singola', async () => {
    const req = {
      user: { id: 3 },
      body: {
        title: 'T',
        description: 'D',
        category: 'Sidewalks',
        latitude: '46',
        longitude: '8',
        photos: ' http://host/pic.jpg ',
      },
    };
    const res = mkRes();

    repo.createReport.mockResolvedValue({ id: 33, photos: ['http://host/pic.jpg'] });

    await controller.createReport(req, res);

    expect(repo.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 3,
        latitude: 46,
        longitude: 8,
        photos: ['http://host/pic.jpg'],
      }),
      undefined
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('400 se latitude/longitude non validi', async () => {
    const req = {
      user: { id: 4 },
      body: {
        title: 'T',
        description: 'D',
        category: 'Roads',
        latitude: 'NaN',
        longitude: '7'
      },
      files: [{ filename: 'x.jpg' }],
    };
    const res = mkRes();

    await controller.createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid latitude/longitude' });
  });

  it('propaga AppError', async () => {
    const req = {
      user: { id: 5 },
      body: { title: 'T', description: 'D', category: 'Roads', latitude: '45', longitude: '7' },
      files: [{ filename: 'x.jpg' }],
    };
    const res = mkRes();

    repo.createReport.mockRejectedValue(new AppError('Bad request body', 422));

    await controller.createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad request body' });
  });

  it('500 per errori generici', async () => {
    const req = {
      user: { id: 6 },
      body: { title: 'T', description: 'D', category: 'Roads', latitude: '45', longitude: '7' },
      files: [{ filename: 'x.jpg' }],
    };
    const res = mkRes();

    repo.createReport.mockRejectedValue(new Error('Something odd'));

    await controller.createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});


//
// ──────────────────────────────────────────────
//   TEST getReportById
// ──────────────────────────────────────────────
//
describe('reportController.getReportById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 se id non valido', async () => {
    const req = { params: { id: 'abc' } };
    const res = mkRes();

    await controller.getReportById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid report id' });
  });

  it('200 con report trovato', async () => {
    const req = { params: { id: '10' } };
    const res = mkRes();
    const payload = { id: 10, title: 'T' };

    repo.getReportById.mockResolvedValue(payload);

    await controller.getReportById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('propaga AppError', async () => {
    const req = { params: { id: '11' } };
    const res = mkRes();

    repo.getReportById.mockRejectedValue(new AppError('Not found', 404));

    await controller.getReportById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('500 per errori generici', async () => {
    const req = { params: { id: '12' } };
    const res = mkRes();

    repo.getReportById.mockRejectedValue(new Error('db down'));

    await controller.getReportById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
