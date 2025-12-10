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

// Mock session controller
jest.mock('../../server/controller/sessionController', () => ({
  login: (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username === 'wronguser') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.status(200).json({
      id: 1,
      username: 'testuser',
      name: 'Test',
      surname: 'User',
      type: 'citizen'
    });
  },
  getCurrentSession: (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.status(200).json(req.user);
  },
  logout: (_req, res) => {
    return res.status(200).json({ message: 'Logged out successfully' });
  },
}));

// Mock other controllers
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

describe('POST /api/sessions (Login)', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
    expect(res.body.username).toBe('testuser');
  });

  it('should return 400 if username or password is missing', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ username: 'testuser' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('should return 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ username: 'wronguser', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid credentials/i);
  });
});

describe('GET /api/sessions/current', () => {
  it('should return current user session', async () => {
    const res = await request(app)
      .get('/api/sessions/current');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('type');
  });
});

describe('DELETE /api/sessions/current (Logout)', () => {
  it('should logout successfully', async () => {
    const res = await request(app)
      .delete('/api/sessions/current');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Logged out successfully/i);
  });
});
