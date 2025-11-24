const request = require('supertest');
const { initializeDatabase } = require('../../server/db/init');

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
