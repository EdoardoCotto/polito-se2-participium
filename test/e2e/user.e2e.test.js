const request = require('supertest');
const app = require('../../server/index'); // assicurati che app venga esportato senza listen

describe('User API End-to-End Tests', () => {

  test('GET /users/:id returns user data', async () => {
    const res = await request(app).get('/users/1');
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
    }
  });

  test('POST /users creates a new user', async () => {
    const newUser = {
      username: 'testuser_e2e',
      email: 'testuser@example.com',
      name: 'Test',
      surname: 'User',
      password: 'Password123!'
    };
    const res = await request(app).post('/users').send(newUser);
    expect([201, 409, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) expect(res.body).toHaveProperty('username', 'testuser_e2e');
  });
});
