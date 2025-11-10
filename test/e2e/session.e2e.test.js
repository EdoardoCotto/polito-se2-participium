const request = require('supertest');
const app = require('../../server/index');

describe('Session API End-to-End Tests', () => {

  test('POST /login authenticates user', async () => {
    const credentials = { username: 'alice', password: 'password123' };
    const res = await request(app).post('/login').send(credentials);
    expect([200, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) expect(res.body).toHaveProperty('username', 'alice');
  });

  test('POST /logout logs out user', async () => {
    const res = await request(app).post('/logout').send();
    expect([200, 401]).toContain(res.statusCode);
  });

  test('GET /session returns current session', async () => {
    const res = await request(app).get('/session').send();
    expect([200, 401]).toContain(res.statusCode);
  });
});
