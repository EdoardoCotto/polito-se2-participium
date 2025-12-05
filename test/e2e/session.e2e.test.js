// Ensure real sqlite3 in E2E and polyfill exec if missing
jest.resetModules();
jest.unmock('sqlite3');
jest.doMock('sqlite3', () => {
  const real = jest.requireActual('sqlite3');
  const moduleWithVerbose = typeof real.verbose === 'function' ? real : { ...real, verbose: () => real };
  try {
    const TestDb = new moduleWithVerbose.Database(':memory:');
    const hasExec = typeof TestDb.exec === 'function';
    TestDb.close();
    if (!hasExec) {
      const OriginalDatabase = moduleWithVerbose.Database;
      moduleWithVerbose.Database = function(...args) {
        if (typeof args[0] === 'string' && args[0] !== ':memory:' && !String(args[0]).startsWith('file:')) {
          args[0] = 'file:participium?mode=memory&cache=shared';
        }
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
      moduleWithVerbose.Database.prototype = OriginalDatabase.prototype;
    }
  } catch {}
  return moduleWithVerbose;
}, { virtual: true });
// Avoid file unlink races during DB resets in E2E
jest.doMock('node:fs', () => {
  const real = jest.requireActual('node:fs');
  return { ...real, existsSync: () => false, unlinkSync: () => {} };
});
const request = require('supertest');
const fs = require('node:fs');
const path = require('node:path');
async function initializeDatabase() {
  const { resetDatabase } = require('../../server/db/init');
  await resetDatabase();
}

let app;
let userDao;
let agent;

beforeAll(async () => {
  // Initialize schema BEFORE loading app & dao (avoids race/no-table errors)
  await initializeDatabase();
  app = require('../../server/index');
  userDao = require('../../server/dao/userDao');
  agent = request.agent(app);
});

describe('Session API End-to-End Tests', () => {

  test('POST /api/sessions fails with invalid credentials', async () => {
    const res = await agent.post('/api/sessions').send({ username: 'wrong', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  test('Login success -> get current session -> logout -> get current session 401', async () => {
    
    const uname = `e2e_${Date.now()}`;
    await userDao.createUser({
      username: uname,
      email: `${uname}@example.com`,
      name: 'E2E',
      surname: 'User',
      password: 'Password123!'
    });

    const loginRes = await agent.post('/api/sessions').send({ username: uname, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('username');

    const currentRes = await agent.get('/api/sessions/current');
    expect(currentRes.statusCode).toBe(200);
    expect(currentRes.body).toHaveProperty('username');

    const logoutRes = await agent.delete('/api/sessions/current');
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body).toHaveProperty('message', 'Logged out successfully');

    const afterLogout = await agent.get('/api/sessions/current');
    expect(afterLogout.statusCode).toBe(401);
    expect(afterLogout.body).toHaveProperty('message', 'Not authenticated');
  });
});
