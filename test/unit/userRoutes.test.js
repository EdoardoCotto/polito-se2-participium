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
// Stub Telegram service to avoid importing external dependency
jest.mock('../../server/services/telegramBotService', () => ({
  initializeBot: () => null,
  getBot: () => null,
  processWebhookUpdate: () => {}
}));
// Stub Telegram controller to prevent bot service import during app load
jest.mock('../../server/controller/telegramController', () => ({
  handleWebhook: (_req, res) => res.status(200).json({ ok: true }),
  getBotInfo: (_req, res) => res.status(503).json({ error: 'Telegram bot not initialized' }),
}));
// Stub reportRoutes to avoid unrelated handler issues when mounting all routes
jest.mock('../../server/routes/reportRoutes', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/reports/pending', (_req, res) => res.json([]));
  router.get('/streets', (_req, res) => res.json([]));
  return router;
});

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

// Mock user controller
jest.mock('../../server/controller/userController', () => ({
  createUser: (req, res) => {
    const { username, email, password, name, surname } = req.body || {};
    if (!username || !email || !password || !name || !surname) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (username === 'existinguser') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    return res.status(201).json({ id: 1, username, email });
  },
  createUserIfAdmin: (req, res) => {
    const { username, email, type } = req.body || {};
    if (!username || !email || !type) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    return res.status(201).json({ id: 2, username, email, type });
  },
  addRoleToUser: (req, res) => {
    const { role } = req.body || {};
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    return res.status(200).json({ 
      id: Number.parseInt(req.params.id, 10),
      role 
    });
  },
  deleteRoleFromUser: (req, res) => {
    const { role } = req.body || {};
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    return res.status(200).json({ message: 'Role deleted successfully' });
  },
  getAllowedRoles: (_req, res) => {
    return res.status(200).json({
      roles: ['citizen', 'admin', 'urban_planner', 'technical_office_staff_member']
    });
  },
  getMunicipalityUsers: (_req, res) => {
    return res.status(200).json([
      { id: 5, username: 'planner1', type: 'urban_planner' }
    ]);
  },
  updateUserProfile: (req, res) => {
    const { telegram_nickname, mail_notifications } = req.body || {};
    return res.status(200).json({
      id: Number.parseInt(req.params.id, 10),
      telegram_nickname,
      mail_notifications
    });
  },
  getExternalMaintainers: (_req, res) => {
    return res.status(200).json([
      { id: 10, username: 'maintainer1', type: 'external_maintainer' }
    ]);
  },
  // Ensure routes mount without handler errors
  confirmRegistration: (req, res) => {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and confirmation code are required' });
    }
    return res.status(200).json({ success: true, message: 'Account successfully confirmed. You can now log in.' });
  },
  resendConfirmationCode: (req, res) => {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    return res.status(200).json({ success: true, message: 'Confirmation code sent to your email' });
  },
}));

// Mock other controllers
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
  // Needed by /streets route in reportRoutes
  getStreets: (_req, res) => res.json([]),
}));

jest.mock('../../server/controller/commentController', () => ({
  createComment: (_req, res) => res.status(201).json({ id: 1 }),
  getComments: (_req, res) => res.json([]),
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

describe('POST /api/users (Citizen Registration)', () => {
  it('should register a new citizen successfully', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        username: 'newcitizen',
        email: 'citizen@example.com',
        password: 'securePass123!',
        name: 'John',
        surname: 'Doe'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.username).toBe('newcitizen');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        username: 'incomplete'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('should return 409 if username already exists', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        username: 'existinguser',
        email: 'test@example.com',
        password: 'pass123',
        name: 'Test',
        surname: 'User'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });
});

describe('POST /api/users/admin (Admin User Creation)', () => {
  it('should create a new user as admin', async () => {
    const res = await request(app)
      .post('/api/users/admin')
      .send({
        username: 'newplanner',
        email: 'planner@example.com',
        password: 'pass123',
        name: 'Jane',
        surname: 'Smith',
        type: 'urban_planner'
      });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('urban_planner');
  });

  it('should return 400 if type is missing', async () => {
    const res = await request(app)
      .post('/api/users/admin')
      .send({
        username: 'newuser',
        email: 'user@example.com',
        password: 'pass123'
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/users/:id/assign-role (Assign Role)', () => {
  it('should assign a role to a user', async () => {
    const res = await request(app)
      .post('/api/users/5/assign-role')
      .send({ role: 'technical_office_staff_member' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(5);
    expect(res.body.role).toBe('technical_office_staff_member');
  });

  it('should return 400 if type is missing', async () => {
    const res = await request(app)
      .post('/api/users/5/assign-role')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });
});

describe('GET /api/users/roles (Get Allowed Roles)', () => {
  it('should return list of allowed roles', async () => {
    const res = await request(app)
      .get('/api/users/roles');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('roles');
    expect(Array.isArray(res.body.roles)).toBe(true);
  });
});

describe('GET /api/users/municipality (Get Municipality Users)', () => {
  it('should return list of municipality users', async () => {
    const res = await request(app)
      .get('/api/users/municipality');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('PUT /api/users/:id/update (Update Profile)', () => {
  it('should update user profile', async () => {
    const res = await request(app)
      .put('/api/users/1/update')
      .send({
        telegram_nickname: '@johndoe',
        mail_notifications: true
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.telegram_nickname).toBe('@johndoe');
  });
});

describe('GET /api/users/external-maintainers', () => {
  it('should return list of external maintainers', async () => {
    const res = await request(app)
      .get('/api/users/external-maintainers');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('type', 'external_maintainer');
  });
});
