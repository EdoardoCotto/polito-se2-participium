// Ensure real sqlite3 in E2E: bypass moduleNameMapper
jest.resetModules();
jest.unmock('sqlite3');
jest.doMock('sqlite3', () => {
  const real = jest.requireActual('sqlite3');
  const moduleWithVerbose = typeof real.verbose === 'function' ? real : { ...real, verbose: () => real };
  // Polyfill Database.exec if missing: run statements sequentially
  try {
    const TestDb = new moduleWithVerbose.Database(':memory:');
    const hasExec = typeof TestDb.exec === 'function';
    TestDb.close();
    if (!hasExec) {
      const OriginalDatabase = moduleWithVerbose.Database;
      moduleWithVerbose.Database = function(...args) {
        const db = new OriginalDatabase(...args);
        if (typeof db.exec !== 'function') {
          db.exec = (sql, cb) => {
            const statements = String(sql)
              .split(';')
              .map(s => s.trim())
              .filter(s => s.length);
            const runSequentially = async () => {
              for (const stmt of statements) {
                await new Promise((res, rej) => db.run(stmt, (err) => (err ? rej(err) : res())));
              }
            };
            runSequentially().then(() => cb && cb(null)).catch(err => cb && cb(err));
          };
        }
        return db;
      };
      // preserve prototype methods
      moduleWithVerbose.Database.prototype = OriginalDatabase.prototype;
    }
  } catch {}
  return moduleWithVerbose;
}, { virtual: true });
// Stub fs to avoid unlink EBUSY during resetDatabase in E2E
jest.doMock('node:fs', () => {
  const real = jest.requireActual('node:fs');
  return { ...real, existsSync: () => false, unlinkSync: () => {} };
});
const request = require('supertest');
const fs = require('node:fs');
const path = require('node:path');
const sqlite3Actual = require(require.resolve('sqlite3'));
jest.setTimeout(30000);
const DB_PATH = path.join(__dirname, '../../server/db/participium.db');
const SCHEMA_PATH = path.join(__dirname, '../../server/db/schema.sql');

async function initializeDatabase() {
  // Use server's init to avoid duplication and ensure consistency
  const { resetDatabase } = require('../../server/db/init');
  await resetDatabase();
}

let app;
let userDao;
let agentCitizen;
let agentPro;
let agentTech;

const login = async (agent, username, password) => {
  const res = await agent.post('/api/sessions').send({ username, password });
  expect(res.statusCode).toBe(200);
  return res.body;
};

beforeAll(async () => {
  await initializeDatabase();
  app = require('../../server/index');
  userDao = require('../../server/dao/userDao');
  agentCitizen = request.agent(app);
  agentPro = request.agent(app);
  agentTech = request.agent(app);

  // Create users via DAO
  const ts = Date.now();
  const citizenU = `cit_${ts}`;
  const proU = `pro_${ts}`;
  const techU = `tech_${ts}`;

  await userDao.createUser({
    username: citizenU,
    email: `${citizenU}@example.com`,
    name: 'Citizen',
    surname: 'E2E',
    password: 'Password123!'
  });

  await userDao.createUser({
    username: proU,
    email: `${proU}@example.com`,
    name: 'PRO',
    surname: 'E2E',
    password: 'Password123!',
    type: 'municipal_public_relations_officer'
  });

  await userDao.createUser({
    username: techU,
    email: `${techU}@example.com`,
    name: 'Tech',
    surname: 'E2E',
    password: 'Password123!',
    type: 'urban_planner'
  });

  // Login sessions
  await login(agentCitizen, citizenU, 'Password123!');
  await login(agentPro, proU, 'Password123!');
  await login(agentTech, techU, 'Password123!');
});

describe('Reports API End-to-End', () => {
  let reportIdAccepted;
  let reportIdRejected;

  test('Citizen cannot access pending or assigned endpoints (401)', async () => {
    const p = await agentCitizen.get('/api/reports/pending');
    expect(p.statusCode).toBe(401);
    const a = await agentCitizen.get('/api/reports/assigned');
    expect(a.statusCode).toBe(401);
  });

  test('Citizen creates a report via JSON photos (201)', async () => {
    const res = await agentCitizen
      .post('/api/reports')
      .send({
        title: 'Lamp broken',
        description: 'Streetlight not working',
        category: 'Other',
        latitude: 45.07,
        longitude: 7.68,
        photos: ['http://assets/img1.jpg']
      });
    expect(res.statusCode).toBe(201);
    // Creation mapping does not include joined aliases; retrieve id from pending list
    const pending = await agentPro.get('/api/reports/pending');
    expect(pending.statusCode).toBe(200);
    const match = pending.body.find(r => r.title === 'Lamp broken' && r.latitude === 45.07);
    expect(match).toBeDefined();
    reportIdAccepted = match.id;
  });

  test('PRO sees pending list including the created report', async () => {
    const res = await agentPro.get('/api/reports/pending');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const ids = res.body.map(r => r.id);
    expect(ids).toContain(reportIdAccepted);
  });

  test('Get report by id requires login and returns 200 for PRO', async () => {
    const unauth = await request(app).get(`/api/reports/${reportIdAccepted}`);
    expect(unauth.statusCode).toBe(401);

    const res = await agentPro.get(`/api/reports/${reportIdAccepted}`);
    expect(res.statusCode).toBe(200);
  });

  test('PRO accepts report with technical office role -> Tech sees assigned', async () => {
    const review = await agentPro
      .put(`/api/reports/${reportIdAccepted}/review`)
      .send({ status: 'accepted', technicalOffice: 'urban_planner' });
    expect(review.statusCode).toBe(200);
    expect(review.body).toHaveProperty('status');
    expect(['accepted', 'assigned']).toContain(review.body.status.toLowerCase());

    const assigned = await agentTech.get('/api/reports/assigned');
    expect(assigned.statusCode).toBe(200);
    const ids = assigned.body.map(r => r.id);
    expect(ids).toContain(reportIdAccepted);
  });

  test('Approved endpoint lists the accepted report; invalid bbox returns 400', async () => {
    const list = await request(app).get('/api/reports/approved');
    expect(list.statusCode).toBe(200);
    const ids = list.body.map(r => r.id);
    expect(ids).toContain(reportIdAccepted);

    const badBox = await request(app).get('/api/reports/approved?north=45');
    expect(badBox.statusCode).toBe(400);

    const okBox = await request(app).get('/api/reports/approved?north=46&south=44&east=8&west=7');
    expect(okBox.statusCode).toBe(200);
  });

  test('Create a second report and PRO rejects with explanation', async () => {
    const res = await agentCitizen
      .post('/api/reports')
      .send({
        title: 'Pothole',
        description: 'Big pothole',
        category: 'Other',
        latitude: 45.06,
        longitude: 7.65,
        photos: ['http://assets/img2.png']
      });
    expect(res.statusCode).toBe(201);
    const pending2 = await agentPro.get('/api/reports/pending');
    expect(pending2.statusCode).toBe(200);
    const match2 = pending2.body.find(r => r.title === 'Pothole' && r.latitude === 45.06);
    expect(match2).toBeDefined();
    reportIdRejected = match2.id;

    const rej = await agentPro
      .put(`/api/reports/${reportIdRejected}/review`)
      .send({ status: 'rejected', explanation: 'Duplicate report' });
    expect(rej.statusCode).toBe(200);
    expect(rej.body).toHaveProperty('status');
    expect(rej.body.status.toLowerCase()).toBe('rejected');
  });

  test('Assigned does not include rejected; citizen list includes accepted', async () => {
    const assigned = await agentTech.get('/api/reports/assigned');
    expect(assigned.statusCode).toBe(200);
    const idsA = assigned.body.map(r => r.id);
    expect(idsA).not.toContain(reportIdRejected);

    const citizenList = await agentCitizen.get('/api/reports/citizen');
    expect(citizenList.statusCode).toBe(200);
    const idsC = citizenList.body.map(r => r.id);
    expect(idsC).toContain(reportIdAccepted);
    expect(idsC).not.toContain(reportIdRejected);
  });

  test('Citizen creates a report via multipart upload (201)', async () => {
    const title = 'Lamp via upload';
    const res = await agentCitizen
      .post('/api/reports')
      .field('title', title)
      .field('description', 'Uploaded images flow')
      .field('category', 'Other')
      .field('latitude', '45.081')
      .field('longitude', '7.681')
      .attach('photos', Buffer.from('fakepngcontent'), 'photo1.png')
      .attach('photos', Buffer.from('fakejpgcontent'), 'photo2.jpg');
    expect(res.statusCode).toBe(201);

    const pending = await agentPro.get('/api/reports/pending');
    expect(pending.statusCode).toBe(200);
    const match = pending.body.find(r => r.title === title && r.latitude === 45.081);
    expect(match).toBeDefined();
    expect(Array.isArray(match.photos)).toBe(true);
    expect(match.photos.length).toBeGreaterThanOrEqual(1);
    // Uploaded files should be mapped to /static/uploads/<filename>
    match.photos.forEach(p => expect(p).toMatch(/\/static\/uploads\//));
  });

  test('Anonymous report via multipart has null userId in pending', async () => {
    const title = 'Anonymous upload';
    const res = await agentCitizen
      .post('/api/reports/anonymous')
      .field('title', title)
      .field('description', 'Anonymous images flow')
      .field('category', 'Other')
      .field('latitude', '45.082')
      .field('longitude', '7.682')
      .field('anonymous', 'true')
      .attach('photos', Buffer.from('fakepngcontent'), 'anon1.png');
    expect(res.statusCode).toBe(201);

    const pending = await agentPro.get('/api/reports/pending');
    expect(pending.statusCode).toBe(200);
    const match = pending.body.find(r => r.title === title && r.latitude === 45.082);
    expect(match).toBeDefined();
    expect(match.userId === null || match.userId === undefined).toBe(true);
  });
});
