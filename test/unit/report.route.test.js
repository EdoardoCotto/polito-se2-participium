// __tests__/reports.route.test.js
const request = require('supertest');

// Mock auth: setta req.user
jest.mock('../../server/middlewares/authMiddleware', () => ({
  isLoggedIn: (req, _res, next) => { req.user = { id: 1, type: 'citizen' }; next(); },
  isAdmin: (_req, _res, next) => next(),
  isMunicipal_public_relations_officer: (req, _res, next) => { req.user = { id: 2, type: 'municipal_public_relations_officer' }; next(); },
  isTechnicalOfficeStaff: (req, _res, next) => { req.user = { id: 3, type: 'urban_planner' }; next(); },
}));

// Mock upload: usa memoryStorage così non scriviamo su disco
// Mock upload: memoryStorage + fileFilter + wrapper che trasforma errori in 400
jest.mock('../../server/middlewares/uploadMiddleware.js', () => {
  const multer = require('multer');
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type, only images are allowed!');
      err.code = 'LIMIT_FILE_TYPE';
      cb(err, false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { files: 3, fileSize: 5 * 1024 * 1024 },
  }).array('photos', 3);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return next();
    });
  };
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
});
