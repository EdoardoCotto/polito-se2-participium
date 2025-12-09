// __tests__/reports.route.test.js
const request = require('supertest');

// Mock auth: setta req.user
jest.mock('../../server/middlewares/authMiddleware', () => ({
  isLoggedIn: (req, _res, next) => { req.user = { id: 1, type: 'citizen' }; next(); },
  isAdmin: (_req, _res, next) => next(),
  isMunicipal_public_relations_officer: (req, _res, next) => { req.user = { id: 2, type: 'municipal_public_relations_officer' }; next(); },
  isTechnicalOfficeStaff: (req, _res, next) => { req.user = { id: 3, type: 'urban_planner' }; next(); },
  // Route mount requires this guard for /reports/:id/status
  isExternalMaintainer: (req, _res, next) => { req.user = { id: 4, type: 'external_maintainer' }; next(); },
  // Needed by userRoutes: provide a no-op middleware so route mounting succeeds.
  updateProfile: (_req, _res, next) => next(),
}));

// Mock controller to simplify success/error paths and avoid DB dependency.
jest.mock('../../server/controller/reportController', () => ({
  createReport: (req, res) => {
    const photos = (req.files || []).map(f => f.originalname);
    if (!photos.length) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }
    const { latitude, longitude } = req.body || {};
    if (Number.isNaN(Number.parseFloat(latitude)) || Number.isNaN(Number.parseFloat(longitude))) {
      return res.status(400).json({ error: 'Invalid latitude/longitude' });
    }
    return res.status(201).json({ id: 1, photos });
  },
  getPendingReports: (_req, res) => res.json([]),
  getApprovedReports: (_req, res) => res.json([{ id: 10 }]),
  getCitizenReports: (_req, res) => res.json([{ id: 20 }]),
  getAssignedReports: (_req, res) => res.json([{ id: 30 }]),
  getReportById: (req, res) => res.json({ id: Number.parseInt(req.params.id, 10) }),
  reviewReport: (req, res) => {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    return res.json({ id: Number.parseInt(req.params.id, 10), status });
  },
  // Provide no-op handlers to satisfy route mounting for these endpoints
  assignReportToExternalMaintainer: (_req, res) => res.status(200).json({ ok: true }),
  updateMaintainerStatus: (_req, res) => res.status(200).json({ ok: true })
}));

// Mock upload: usa memoryStorage così non scriviamo su disco
// Mock upload: memoryStorage + fileFilter + wrapper che trasforma errori in 400
jest.mock('../../server/middlewares/uploadMiddleware.js', () => {
  const multer = require('multer');
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type, only images are allowed!');
      err.code = 'LIMIT_FILE_TYPE';
      cb(err, false);
    }
  };

  const uploadArray = multer({
    storage,
    fileFilter,
    limits: { files: 3, fileSize: 5 * 1024 * 1024 },
  }).array('photos', 3);

  // profile middleware mock (e.g. single avatar upload)
  const updateProfile = (req, _res, next) => { next(); };

  const wrapper = (req, res, next) => {
    uploadArray(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return next();
    });
  };
  wrapper.updateProfile = updateProfile; // allow destructuring in userRoutes
  return wrapper;
});


const app = require('../../server/index');

describe('POST /api/reports', () => {
    it('400 se nessuna foto', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('title', 'T')
      .field('description', 'D')
      .field('category', 'Public Lighting')
      .field('latitude', '45')
      .field('longitude', '7');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/At least one photo/i);
  });

  it('400 se lat/lon non numerici', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('title', 'T')
      .field('description', 'D')
      .field('category', 'Public Lighting')
      .field('latitude', 'abc')
      .field('longitude', 'xyz')
      .attach('photos', Buffer.from([1]), { filename: 'a.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid latitude\/longitude/i);
  });

  it('400 se mimetype non immagine', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('title', 'T')
      .field('description', 'D')
      .field('category', 'Public Lighting')
      .field('latitude', '45')
      .field('longitude', '7')
      .attach('photos', Buffer.from('foo'), { filename: 'a.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid file type|images/i);
  });

  it('201 successo con foto valida', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('title', 'T')
      .field('description', 'D')
      .field('category', 'Public Lighting')
      .field('latitude', '45')
      .field('longitude', '7')
      .attach('photos', Buffer.from([1,2,3]), { filename: 'a.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
  });
});

describe('POST /api/reports/anonymous', () => {
  it('201 successo anonimo', async () => {
    const res = await request(app)
      .post('/api/reports/anonymous')
      .field('title', 'Anon')
      .field('description', 'Desc')
      .field('category', 'Public Lighting')
      .field('latitude', '45')
      .field('longitude', '7')
      .attach('photos', Buffer.from([9]), { filename: 'x.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
  });
});

describe('GET listing endpoints', () => {
  it('GET /api/reports/pending 200', async () => {
    const res = await request(app).get('/api/reports/pending');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  it('GET /api/reports/approved 200', async () => {
    const res = await request(app).get('/api/reports/approved');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(10);
  });
  it('GET /api/reports/citizen 200', async () => {
    const res = await request(app).get('/api/reports/citizen');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(20);
  });
  it('GET /api/reports/assigned 200', async () => {
    const res = await request(app).get('/api/reports/assigned');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(30);
  });
});

describe('GET /api/reports/:id', () => {
  it('200 con id', async () => {
    const res = await request(app).get('/api/reports/55');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(55);
  });
});

describe('PUT /api/reports/:id/review', () => {
  it('400 se manca status', async () => {
    const res = await request(app)
      .put('/api/reports/77/review')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Status is required/i);
  });
  it('200 con status accepted', async () => {
    const res = await request(app)
      .put('/api/reports/77/review')
      .send({ status: 'accepted' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
  });
});
