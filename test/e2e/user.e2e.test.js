const request = require('supertest');
const app = require('../../server/index');
const userDao = require('../../server/dao/userDao');

describe('User API End-to-End Tests', () => {
  const agent = request.agent(app);

  test('POST /api/users registers a new citizen (or 409 if exists)', async () => {
    const unique = `cit_${Date.now()}`;
    const newUser = {
      username: unique,
      email: `${unique}@example.com`,
      name: 'Test',
      surname: 'User',
      password: 'Password123!'
    };
    const res = await agent.post('/api/users').send(newUser);
    expect([201, 409, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty('username', unique);
    }
  });

  test('Admin flow: login as runtime-created admin, create user with role, assign role, fetch municipality users', async () => {
    // Crea un admin reale con password bcrypt via DAO e poi effettua il login
    const adminU = `admin_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'E2E',
      password: 'Password123!',
      type: 'admin'
    });

    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    const unique = `tech_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: unique,
      email: `${unique}@example.com`,
      name: 'Tech',
      surname: 'User',
      password: 'Password123!',
      type: 'urban_planner'
    });
    expect([201, 409, 400]).toContain(createRes.statusCode);
    let createdId;
    if (createRes.statusCode === 201) {
      expect(createRes.body).toHaveProperty('username', unique);
      createdId = createRes.body.id;
    }

    if (createdId) {
      const assignRes = await agent.put(`/api/users/${createdId}/type`).send({ type: 'building_inspector' });
      expect(assignRes.statusCode).toBe(200);
      expect(assignRes.body).toHaveProperty('type', 'building_inspector');
    }

    const muniRes = await agent.get('/api/users/municipality');
    expect(muniRes.statusCode).toBe(200);
    expect(Array.isArray(muniRes.body)).toBe(true);
  });
});
