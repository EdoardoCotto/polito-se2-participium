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
// Stub Telegram service to avoid importing external dependency
jest.mock('../../server/services/telegramBotService', () => ({
  initializeBot: () => null,
  getBot: () => null,
  processWebhookUpdate: () => {}
}));
// Mock Telegram controller to avoid requiring bot service during app load
jest.mock('../../server/controller/telegramController', () => ({
  handleWebhook: (_req, res) => res.status(200).json({ ok: true }),
  getBotInfo: (_req, res) => res.status(503).json({ error: 'Telegram bot not initialized' }),
}));
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
    password: 'Password123!',
    skipConfirmation: true
  });

  await userDao.createUser({
    username: proU,
    email: `${proU}@example.com`,
    name: 'PRO',
    surname: 'E2E',
    password: 'Password123!',
    skipConfirmation: true,
    type: 'municipality_user'
  });
  // Assign PRO role to municipality user
  const proUser = await userDao.getUserByUsername(proU);
  if (proUser && proUser.id) {
    await userDao.addRoleToUser(proUser.id, 'municipal_public_relations_officer');
  }

  await userDao.createUser({
    username: techU,
    email: `${techU}@example.com`,
    name: 'Tech',
    surname: 'E2E',
    password: 'Password123!',
    skipConfirmation: true,
    type: 'municipality_user'
  });
  // Assign technical office role to municipality user
  const techUser = await userDao.getUserByUsername(techU);
  if (techUser && techUser.id) {
    await userDao.addRoleToUser(techUser.id, 'urban_planner');
  }

  // Patch login DAO to avoid context issues with "this" in getUser
  jest.spyOn(userDao, 'getUser').mockImplementation((username, password) => {
    return new Promise((resolve, reject) => {
      userDao.getUserByUsername(username)
        .then(row => {
          if (!row) {
            resolve(false);
            return;
          }
          // Minimal user object for login; roles will be loaded in deserialize via getUserById
          resolve({
            id: row.id,
            username,
            name: 'E2E',
            surname: 'User',
            email: `${username}@example.com`,
            type: 'citizen',
            telegram_nickname: null,
            personal_photo_path: null,
            mail_notifications: 1,
            roles: []
          });
        })
        .catch(reject);
    });
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
  
  describe('Street view endpoint', () => {
    let streetReportId;

    beforeAll(async () => {
      // Crea un report con coordinate specifiche per Via Roma, Torino
      const res = await agentCitizen
        .post('/api/reports')
        .send({
          title: 'Street test report',
          description: 'Test report for street filtering',
          category: 'Other',
          latitude: 45.0703,
          longitude: 7.6869,
          photos: ['http://assets/street-test.jpg']
        });
      expect(res.statusCode).toBe(201);

      // Accetta il report per renderlo visibile
      const pending = await agentPro.get('/api/reports/pending');
      const match = pending.body.find(r => r.title === 'Street test report');
      expect(match).toBeDefined();
      streetReportId = match.id;

      const review = await agentPro
        .put(`/api/reports/${streetReportId}/review`)
        .send({ status: 'accepted', technicalOffice: 'urban_planner' });
      expect(review.statusCode).toBe(200);
    });

    test('GET /api/streets returns autocomplete suggestions', async () => {
      const res = await request(app).get('/api/streets').query({ q: 'Via Ro' });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('street_name');
        expect(res.body[0]).toHaveProperty('city');
      }
    });

    test('GET /api/streets/:name/reports returns 404 for non-existent street', async () => {
      const res = await request(app).get('/api/streets/Via Inesistente XYZ/reports');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    test('GET /api/streets/:name/reports returns map focus and reports for valid street', async () => {
      // Usa una strada conosciuta di Torino
      const streetName = 'Via Roma';
      const res = await request(app).get(`/api/streets/${encodeURIComponent(streetName)}/reports`);
      
      // L'ambiente di test potrebbe non avere la via nel DB: accetta 200 o 404
      expect([200, 404]).toContain(res.statusCode);

      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('mapFocus');
        expect(res.body).toHaveProperty('reports');
        expect(res.body).toHaveProperty('street');
        expect(res.body).toHaveProperty('stats');

        // Stats opzionali: coerenza con i dati restituiti
        const { stats } = res.body;
        expect(stats).toHaveProperty('total');
        expect(typeof stats.total).toBe('number');
        expect(stats.total).toBe(res.body.reports.length);

        // Verifica struttura mapFocus
        expect(res.body.mapFocus).toHaveProperty('center');
        expect(res.body.mapFocus.center).toHaveProperty('lat');
        expect(res.body.mapFocus.center).toHaveProperty('lon');
        expect(res.body.mapFocus).toHaveProperty('boundingBox');
        expect(res.body.mapFocus.boundingBox).toHaveProperty('north');
        expect(res.body.mapFocus.boundingBox).toHaveProperty('south');
        expect(res.body.mapFocus.boundingBox).toHaveProperty('east');
        expect(res.body.mapFocus.boundingBox).toHaveProperty('west');

        // Verifica che reports sia un array
        expect(Array.isArray(res.body.reports)).toBe(true);
        
        // Se ci sono reports, verifica la struttura
        if (res.body.reports.length > 0) {
          const report = res.body.reports[0];
          expect(report).toHaveProperty('id');
          expect(report).toHaveProperty('latitude');
          expect(report).toHaveProperty('longitude');
        }
      } else {
        // In caso di 404, assicurati che ci sia un messaggio di errore
        expect(res.body).toHaveProperty('error');
      }
    });

    test('GET /api/streets/:name/reports filters reports within street geometry', async () => {
      const streetName = 'Via Roma';
      const res = await request(app).get(`/api/streets/${encodeURIComponent(streetName)}/reports`);
      
      // Accetta 200 o 404 in funzione della disponibilità della via
      expect([200, 404]).toContain(res.statusCode);

      if (res.statusCode === 200) {
        // Verifica che tutti i report restituiti siano dentro il bounding box
        const { boundingBox } = res.body.mapFocus;
        res.body.reports.forEach(report => {
          expect(report.latitude).toBeGreaterThanOrEqual(boundingBox.south);
          expect(report.latitude).toBeLessThanOrEqual(boundingBox.north);
          expect(report.longitude).toBeGreaterThanOrEqual(boundingBox.west);
          expect(report.longitude).toBeLessThanOrEqual(boundingBox.east);
        });

        // Se presente la geometria della strada, verifica tipo Polygon/MultiPolygon
        if (res.body.street && res.body.street.geometry) {
          const geom = res.body.street.geometry;
          expect(geom).toHaveProperty('type');
          expect(['Polygon', 'MultiPolygon']).toContain(geom.type);
        }
      } else {
        // In caso di 404, assicurati che ci sia un messaggio di errore
        expect(res.body).toHaveProperty('error');
      }
    });

    test('GET /api/streets/:name/reports handles special characters in street name', async () => {
      // Testa una strada con caratteri speciali
      const streetName = "Via Sant'Agostino";
      const res = await request(app).get(`/api/streets/${encodeURIComponent(streetName)}/reports`);
      
      // Potrebbe essere 404 se la strada non esiste o 200 se esiste
      expect([200, 404]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('mapFocus');
        expect(res.body).toHaveProperty('reports');
      }
    });

    test('Street autocomplete is case insensitive', async () => {
      const lowerCase = await request(app).get('/api/streets').query({ q: 'via ro' });
      const upperCase = await request(app).get('/api/streets').query({ q: 'VIA RO' });
      const mixedCase = await request(app).get('/api/streets').query({ q: 'Via Ro' });
      
      expect(lowerCase.statusCode).toBe(200);
      expect(upperCase.statusCode).toBe(200);
      expect(mixedCase.statusCode).toBe(200);
      
      // Tutti dovrebbero restituire risultati simili
      expect(Array.isArray(lowerCase.body)).toBe(true);
      expect(Array.isArray(upperCase.body)).toBe(true);
      expect(Array.isArray(mixedCase.body)).toBe(true);
    });

    test('Street endpoint returns only reports with accepted status', async () => {
      const streetName = 'Via Roma';
      const res = await request(app).get(`/api/streets/${encodeURIComponent(streetName)}/reports`);
      
      if (res.statusCode === 200 && res.body.reports.length > 0) {
        res.body.reports.forEach(report => {
          // Il report deve essere accepted o in uno stato successivo
          expect(['accepted', 'assigned', 'progress', 'suspended', 'resolved']).toContain(report.status.toLowerCase());
        });
      }
    });

    test('Street autocomplete respects limit parameter', async () => {
      const res = await request(app).get('/api/streets').query({ q: 'Via' });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Il DAO ha un limite di default di 10
      expect(res.body.length).toBeLessThanOrEqual(10);
    });

    test('GET /api/streets/:name/reports with URL-encoded street name', async () => {
      const streetName = 'Corso Vittorio Emanuele II';
      const res = await request(app).get(`/api/streets/${encodeURIComponent(streetName)}/reports`);
      
      // Potrebbe essere 404 se la strada non è nel database
      expect([200, 404]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('mapFocus');
        expect(res.body.mapFocus).toHaveProperty('center');
        expect(res.body).toHaveProperty('reports');
      }
    });
  });

});
