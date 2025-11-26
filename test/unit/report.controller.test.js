// __tests__/report.controller.test.js
jest.mock('../../server/repository/reportRepository', () => ({
  createReport: jest.fn(),
  getReportById: jest.fn(),
  getPendingReports: jest.fn(),
  getApprovedReports: jest.fn(),
  getCitizenReports: jest.fn(),
  getAssignedReports: jest.fn(),
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

    const call = repo.createReport.mock.calls[0];
    expect(call).toBeDefined();
    expect(call[1]).toBeUndefined();
    expect(call[0]).toMatchObject({
      userId: 1,
      latitude: 45,
      longitude: 7,
      photos: ['/static/uploads/x.jpg', '/static/uploads/y.png'],
    });

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

    const call = repo.createReport.mock.calls[0];
    expect(call[1]).toBeUndefined();
    expect(call[0]).toMatchObject({
      userId: 2,
      latitude: 45.1,
      longitude: 7.2,
      photos: ['http://a/img1.jpg', 'http://a/img2.png'],
    });

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

    const call = repo.createReport.mock.calls[0];
    expect(call[1]).toBeUndefined();
    expect(call[0]).toMatchObject({
      userId: 3,
      latitude: 46,
      longitude: 8,
      photos: ['http://host/pic.jpg'],
    });

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

  it('400 se errore "File too large" dal repository', async () => {
    const req = {
      user: { id: 7 },
      body: { title: 'T', description: 'D', category: 'Roads', latitude: '45', longitude: '7' },
      files: [{ filename: 'x.jpg' }],
    };
    const res = mkRes();
    repo.createReport.mockRejectedValue(new Error('File too large - limit exceeded'));
    await controller.createReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/File too large/i) });
  });

  it('400 se errore "Too many files" dal repository', async () => {
    const req = {
      user: { id: 8 },
      body: { title: 'T', description: 'D', category: 'Roads', latitude: '45', longitude: '7' },
      files: [{ filename: 'x.jpg' }],
    };
    const res = mkRes();
    repo.createReport.mockRejectedValue(new Error('Too many files uploaded'));
    await controller.createReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/Too many files/i) });
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

// ──────────────────────────────────────────────
//   TEST getPendingReports
// ──────────────────────────────────────────────
describe('reportController.getPendingReports', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 con mapping photoUrls', async () => {
    const req = { protocol: 'http', get: () => 'host:123' };
    const res = mkRes();
    repo.getPendingReports.mockResolvedValue([
      { id: 1, photos: ['/static/uploads/a.jpg', '/static/uploads/b.png'] },
    ]);

    await controller.getPendingReports(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload[0].photoUrls).toEqual([
      'http://host:123/static/uploads/a.jpg',
      'http://host:123/static/uploads/b.png',
    ]);
  });

  it('500 su errore generico', async () => {
    const req = { protocol: 'http', get: () => 'host' };
    const res = mkRes();
    repo.getPendingReports.mockRejectedValue(new Error('fail'));
    await controller.getPendingReports(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('propaga AppError', async () => {
    const req = { protocol: 'http', get: () => 'host' };
    const res = mkRes();
    repo.getPendingReports.mockRejectedValue(new AppError('nope', 409));
    await controller.getPendingReports(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'nope' });
  });
});

// ──────────────────────────────────────────────
//   TEST getApprovedReports (bounding box parsing)
// ──────────────────────────────────────────────
describe('reportController.getApprovedReports', () => {
  beforeEach(() => jest.clearAllMocks());

  const baseReq = (query) => ({
    protocol: 'https',
    get: () => 'example.com',
    query: query || {},
  });

  it('200 senza bounding box (null) mapping photoUrls', async () => {
    const req = baseReq({});
    const res = mkRes();
    repo.getApprovedReports.mockResolvedValue([
      { id: 1, photos: [' /static/uploads/ spaced.jpg ', '/static/uploads/x.png'] },
    ]);
    await controller.getApprovedReports(req, res);
    expect(repo.getApprovedReports).toHaveBeenCalledWith({ boundingBox: null });
    const payload = res.json.mock.calls[0][0];
    // Nota: il path originale contiene spazio prima del nome file "spaced.jpg";
    // buildPhotoUrls non rimuove lo spazio nel basename, quindi l'URL mantiene lo spazio.
    expect(payload[0].photoUrls).toEqual([
      'https://example.com/static/uploads/ spaced.jpg',
      'https://example.com/static/uploads/x.png',
    ]);
  });

  it('400 se bounding box incompleto', async () => {
    const req = baseReq({ north: '45' });
    const res = mkRes();
    await controller.getApprovedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/Bounding box requires/i) });
  });

  it('400 se coordinate non numeriche', async () => {
    const req = baseReq({ north: 'a', south: '44', east: '8', west: '7' });
    const res = mkRes();
    await controller.getApprovedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/valid numbers/i) });
  });

  it('400 se south > north', async () => {
    const req = baseReq({ north: '10', south: '11', east: '8', west: '7' });
    const res = mkRes();
    await controller.getApprovedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/South latitude/i) });
  });

  it('400 se west > east', async () => {
    const req = baseReq({ north: '11', south: '10', east: '7', west: '8' });
    const res = mkRes();
    await controller.getApprovedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/West longitude/i) });
  });

  it('200 con bounding box valido', async () => {
    const req = baseReq({ north: '11', south: '10', east: '8', west: '7' });
    const res = mkRes();
    repo.getApprovedReports.mockResolvedValue([{ id: 2, photos: [] }]);
    await controller.getApprovedReports(req, res);
    expect(repo.getApprovedReports).toHaveBeenCalledWith({
      boundingBox: { north: 11, south: 10, east: 8, west: 7 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('500 per errori generici', async () => {
    const req = baseReq({});
    const res = mkRes();
    repo.getApprovedReports.mockRejectedValue(new Error('boom'));
    await controller.getApprovedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('propaga AppError dal repository', async () => {
    const req = { protocol: 'https', get: () => 'example.com', query: {} };
    const res = mkRes();
    repo.getApprovedReports.mockRejectedValue(new AppError('boom app', 451));
    await controller.getApprovedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(451);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom app' });
  });

  it('200 con photos non array (branch buildPhotoUrls early return)', async () => {
    const req = baseReq({});
    const res = mkRes();
    repo.getApprovedReports.mockResolvedValue([{ id: 99, photos: 'not-an-array' }]);
    await controller.getApprovedReports(req, res);
    const payload = res.json.mock.calls[0][0];
    expect(payload[0].photoUrls).toEqual([]);
  });

  it('filtra elementi vuoti/whitespace in photos', async () => {
    const req = baseReq({});
    const res = mkRes();
    repo.getApprovedReports.mockResolvedValue([
      { id: 3, photos: ["", "   ", null, "/static/uploads/ok.png"] },
    ]);
    await controller.getApprovedReports(req, res);
    const payload = res.json.mock.calls[0][0];
    expect(payload[0].photoUrls).toEqual([
      'https://example.com/static/uploads/ok.png',
    ]);
  });
});

// ──────────────────────────────────────────────
//   TEST getCitizenReports
// ──────────────────────────────────────────────
describe('reportController.getCitizenReports', () => {
  beforeEach(() => jest.clearAllMocks());

  const baseReq = (query) => ({ protocol: 'http', get: () => 'host', query: query || {} });

  it('200 senza bounding box: mapping photoUrls', async () => {
    const req = baseReq({});
    const res = mkRes();
    repo.getCitizenReports.mockResolvedValue([{ id: 1, photos: [' /static/uploads/a.jpg '] }]);
    await controller.getCitizenReports(req, res);
    expect(repo.getCitizenReports).toHaveBeenCalledWith({});
    const payload = res.json.mock.calls[0][0];
    expect(payload[0].photoUrls).toEqual(['http://host/static/uploads/a.jpg']);
  });

  it('200 con bounding box presente', async () => {
    const req = baseReq({ north: '11', south: '10', east: '8', west: '7' });
    const res = mkRes();
    repo.getCitizenReports.mockResolvedValue([{ id: 2, photos: [] }]);
    await controller.getCitizenReports(req, res);
    expect(repo.getCitizenReports).toHaveBeenCalledWith({
      boundingBox: { north: '11', south: '10', east: '8', west: '7' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('propaga AppError dal repository', async () => {
    const req = baseReq({});
    const res = mkRes();
    repo.getCitizenReports.mockRejectedValue(new AppError('bad citizen', 400));
    await controller.getCitizenReports(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'bad citizen' });
  });

  it('500 per errore generico', async () => {
    const req = baseReq({});
    const res = mkRes();
    repo.getCitizenReports.mockRejectedValue(new Error('x'));
    await controller.getCitizenReports(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  it('filtra elementi vuoti/whitespace in photos', async () => {
    const req = baseReq({});
    const res = mkRes();
    repo.getCitizenReports.mockResolvedValue([
      { id: 10, photos: ["", " ", null, "/static/uploads/a.png"] },
    ]);
    await controller.getCitizenReports(req, res);
    const payload = res.json.mock.calls[0][0];
    expect(payload[0].photoUrls).toEqual([
      'http://host/static/uploads/a.png',
    ]);
  });
});

// ──────────────────────────────────────────────
//   TEST getAssignedReports
// ──────────────────────────────────────────────
describe('reportController.getAssignedReports', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 se manca user', async () => {
    const req = { user: null };
    const res = mkRes();
    await controller.getAssignedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('401 se manca user.id', async () => {
    const req = { user: { type: 'urban_planner' } };
    const res = mkRes();
    await controller.getAssignedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('200 con mapping', async () => {
    const req = { user: { id: 2, type: 'urban_planner' }, protocol: 'http', get: () => 'h' };
    const res = mkRes();
    repo.getAssignedReports.mockResolvedValue([{ id: 5, photos: ['/static/uploads/a.png'] }]);
    await controller.getAssignedReports(req, res);
    expect(repo.getAssignedReports).toHaveBeenCalledWith(2);
    const payload = res.json.mock.calls[0][0];
    expect(payload[0].photoUrls[0]).toMatch(/http:\/\/h\/static\/uploads\/a.png/);
  });

  it('500 generico', async () => {
    const req = { user: { id: 2, type: 'urban_planner' }, protocol: 'http', get: () => 'h' };
    const res = mkRes();
    repo.getAssignedReports.mockRejectedValue(new Error('x'));
    await controller.getAssignedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('propaga AppError', async () => {
    const req = { user: { id: 9, type: 'urban_planner' }, protocol: 'http', get: () => 'h' };
    const res = mkRes();
    repo.getAssignedReports.mockRejectedValue(new AppError('nope', 409));
    await controller.getAssignedReports(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'nope' });
  });

  it('200 con photos non array (buildPhotoUrls early return)', async () => {
    const req = { user: { id: 3, type: 'urban_planner' }, protocol: 'http', get: () => 'h' };
    const res = mkRes();
    repo.getAssignedReports.mockResolvedValue([{ id: 55, photos: null }]);
    await controller.getAssignedReports(req, res);
    const payload = res.json.mock.calls[0][0];
    expect(payload[0].photoUrls).toEqual([]);
  });
});

// ──────────────────────────────────────────────
//   TEST reviewReport
// ──────────────────────────────────────────────
describe('reportController.reviewReport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 id non valido', async () => {
    const req = { params: { id: 'abc' }, body: {} };
    const res = mkRes();
    await controller.reviewReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 successo', async () => {
    const req = { params: { id: '10' }, body: { status: 'accepted', technicalOffice: 'urban_planner' } };
    const res = mkRes();
    const updated = { id: 10, status: 'assigned' };
    repo.reviewReport.mockResolvedValue(updated);
    await controller.reviewReport(req, res);
    expect(repo.reviewReport).toHaveBeenCalledWith(10, {
      status: 'accepted',
      explanation: undefined,
      technicalOffice: 'urban_planner',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('propaga AppError', async () => {
    const req = { params: { id: '11' }, body: { status: 'rejected', explanation: 'bad' } };
    const res = mkRes();
    repo.reviewReport.mockRejectedValue(new AppError('Bad review', 400));
    await controller.reviewReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad review' });
  });

  it('500 errore generico', async () => {
    const req = { params: { id: '12' }, body: { status: 'accepted', technicalOffice: 'urban_planner' } };
    const res = mkRes();
    repo.reviewReport.mockRejectedValue(new Error('oops'));
    await controller.reviewReport(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
