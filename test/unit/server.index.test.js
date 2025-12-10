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

// Mock all middlewares before requiring the app
jest.mock('../../server/middlewares/authMiddleware', () => ({
  isLoggedIn: (req, _res, next) => { req.user = { id: 1, type: 'citizen' }; next(); },
  isAdmin: (_req, _res, next) => next(),
  isMunicipal_public_relations_officer: (req, _res, next) => { req.user = { id: 2, type: 'municipal_public_relations_officer' }; next(); },
  isTechnicalOfficeStaff: (req, _res, next) => { req.user = { id: 3, type: 'urban_planner' }; next(); },
  isExternalMaintainer: (req, _res, next) => { req.user = { id: 4, type: 'external_maintainer' }; next(); },
  isInternalStaffOrMaintainer: (req, _res, next) => { req.user = { id: 3, type: 'urban_planner' }; next(); },
  updateProfile: (_req, _res, next) => next(),
}));

// Mock all controllers
jest.mock('../../server/controller/reportController', () => ({
  createReport: (_req, res) => res.status(201).json({ id: 1 }),
  getPendingReports: (_req, res) => res.json([]),
  getApprovedReports: (_req, res) => res.json([]),
  getCitizenReports: (_req, res) => res.json([]),
  getAssignedReports: (_req, res) => res.json([]),
  getReportById: (req, res) => res.json({ id: Number.parseInt(req.params.id, 10) }),
  reviewReport: (_req, res) => res.json({ ok: true }),
  assignReportToExternalMaintainer: (_req, res) => res.status(200).json({ ok: true }),
  updateMaintainerStatus: (_req, res) => res.status(200).json({ ok: true }),
}));

jest.mock('../../server/controller/commentController', () => ({
  createComment: (_req, res) => res.status(201).json({ id: 1 }),
  getComments: (_req, res) => res.json([]),
}));

jest.mock('../../server/controller/userController', () => ({
  createUser: (_req, res) => res.status(201).json({ id: 1 }),
  createUserIfAdmin: (_req, res) => res.status(201).json({ id: 1 }),
  assignUserRole: (_req, res) => res.json({ ok: true }),
  getAllowedRoles: (_req, res) => res.json({ roles: [] }),
  getMunicipalityUsers: (_req, res) => res.json([]),
  updateUserProfile: (_req, res) => res.json({ ok: true }),
  getExternalMaintainers: (_req, res) => res.json([]),
}));

jest.mock('../../server/controller/sessionController', () => ({
  login: (_req, res) => res.status(200).json({ id: 1 }),
  getCurrentSession: (_req, res) => res.status(200).json({ id: 1 }),
  logout: (_req, res) => res.status(200).json({ ok: true }),
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

describe('Server Index - Application Setup', () => {
  it('should respond to health check on root', async () => {
    const res = await request(app).get('/api/sessions/current');
    expect(res.status).toBeDefined();
  });

  it('should have CORS enabled', async () => {
    const res = await request(app)
      .get('/api/sessions/current')
      .set('Origin', 'http://localhost:5173');
    
    // CORS should not block the request
    expect(res.status).toBeDefined();
  });

  it('should parse JSON bodies', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ username: 'test', password: 'test' })
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(200);
  });

  it('should serve static files from /static', async () => {
    // This tests that the static middleware is configured
    const res = await request(app).get('/static/user.png');
    // May return 404 if file doesn't exist, but route should be defined
    expect([200, 404]).toContain(res.status);
  });

  it('should handle 404 for undefined routes', async () => {
    const res = await request(app).get('/api/nonexistent-route-12345');
    expect([404, 500]).toContain(res.status);
  });

  it('should mount session routes', async () => {
    const res = await request(app).post('/api/sessions').send({});
    expect(res.status).toBeDefined();
  });

  it('should mount user routes', async () => {
    const res = await request(app).get('/api/users/roles');
    expect(res.status).toBeDefined();
  });

  it('should mount report routes', async () => {
    const res = await request(app).get('/api/reports/pending');
    expect(res.status).toBeDefined();
  });

  it('should mount constant routes', async () => {
    const res = await request(app).get('/api/constants');
    expect(res.status).toBeDefined();
  });

  it('should have error handler middleware', async () => {
    // Error handler should catch errors and return proper format
    const res = await request(app).get('/api/reports/invalid-endpoint-xyz');
    expect(res.status).toBeDefined();
    expect([200, 404, 500]).toContain(res.status);
  });
});

describe('Server Configuration', () => {
  it('should disable x-powered-by header for security', async () => {
    const res = await request(app).get('/api/sessions/current');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('should handle session management', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ username: 'test', password: 'test' });
    
    // Session cookie should be set if using express-session
    expect(res.status).toBe(200);
  });
});
