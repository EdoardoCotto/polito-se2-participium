const request = require('supertest');

// Mock passport first
jest.mock('../../server/utils/passport', () => ({
  initialize: () => (_req, _res, next) => next(),
  session: () => (_req, _res, next) => next(),
}));

// Mock swagger modules
jest.mock('swagger-jsdoc', () => jest.fn(() => ({})));
jest.mock('swagger-ui-express', () => ({
  serve: [(_req, _res, next) => next()],
  setup: () => (_req, _res, next) => next(),
}));

// Mock auth middleware
jest.mock('../../server/middlewares/authMiddleware', () => ({
  isLoggedIn: (req, _res, next) => { req.user = { id: 1, type: 'citizen' }; next(); },
  isAdmin: (_req, _res, next) => next(),
  isMunicipal_public_relations_officer: (req, _res, next) => { req.user = { id: 2, type: 'municipal_public_relations_officer' }; next(); },
  isTechnicalOfficeStaff: (req, _res, next) => { req.user = { id: 3, type: 'urban_planner' }; next(); },
  isExternalMaintainer: (req, _res, next) => { req.user = { id: 4, type: 'external_maintainer' }; next(); },
  isInternalStaffOrMaintainer: (req, _res, next) => { req.user = { id: 3, type: 'urban_planner' }; next(); },
  updateProfile: (_req, _res, next) => next(),
}));

// Mock comment controller
jest.mock('../../server/controller/commentController', () => ({
  createComment: (req, res) => {
    const { comment } = req.body || {};
    if (!comment) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    return res.status(201).json({ 
      id: 1, 
      reportId: Number.parseInt(req.params.id, 10),
      comment 
    });
  },
  getComments: (req, res) => {
    return res.json([
      { id: 1, reportId: Number.parseInt(req.params.id, 10), comment: 'Test comment' }
    ]);
  },
}));

// Mock report controller (required by reportRoutes)
jest.mock('../../server/controller/reportController', () => ({
  createReport: (_req, res) => res.status(201).json({ id: 1 }),
  getPendingReports: (_req, res) => res.json([]),
  getApprovedReports: (_req, res) => res.json([]),
  getCitizenReports: (_req, res) => res.json([]),
  getAssignedReports: (_req, res) => res.json([]),
  getExternalAssignedReports: (_req, res) => res.json([]),
  getReportById: (req, res) => res.json({ id: Number.parseInt(req.params.id, 10) }),
  reviewReport: (_req, res) => res.json({ ok: true }),
  assignReportToExternalMaintainer: (_req, res) => res.status(200).json({ ok: true }),
  updateMaintainerStatus: (_req, res) => res.status(200).json({ ok: true }),
}));

// Mock upload middleware
jest.mock('../../server/middlewares/uploadMiddleware.js', () => {
  const multer = require('multer');
  const storage = multer.memoryStorage();
  const uploadArray = multer({ storage }).array('photos', 3);
  const updateProfile = (req, _res, next) => { next(); };
  const wrapper = (req, res, next) => {
    uploadArray(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      return next();
    });
  };
  wrapper.updateProfile = updateProfile;
  return wrapper;
});

const app = require('../../server/index');

describe('POST /api/comment/:id/comments', () => {
  it('should create a comment successfully', async () => {
    const res = await request(app)
      .post('/api/comment/42/comments')
      .send({ comment: 'This needs urgent attention' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.reportId).toBe(42);
    expect(res.body.comment).toBe('This needs urgent attention');
  });

  it('should return 400 if comment text is missing', async () => {
    const res = await request(app)
      .post('/api/comment/42/comments')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Comment text is required/i);
  });
});

describe('GET /api/comment/:id/comments', () => {
  it('should get all comments for a report', async () => {
    const res = await request(app)
      .get('/api/comment/42/comments');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('comment');
  });
});
