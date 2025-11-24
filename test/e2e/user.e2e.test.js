const request = require('supertest');
const { initializeDatabase } = require('../../server/db/init');

let app;
let userDao;
let agent;

beforeAll(async () => {
  // Assicura che lo schema sia creato prima di importare app/dao
  await initializeDatabase();
  app = require('../../server/index');
  userDao = require('../../server/dao/userDao');
  agent = request.agent(app);
});

describe('User API End-to-End Tests', () => {

  test('POST /api/users registers a new citizen (201) or conflicts (409) or validation error (400)', async () => {
    const unique = `cit_${Date.now()}`;
    const newUser = {
      username: unique,
      email: `${unique}@example.com`,
      name: 'Test',
      surname: 'User',
      password: 'Password123!'
    };
    const res = await agent.post('/api/users').send(newUser);
    // Evitiamo 500: se appare, fallisce esplicitamente
    expect([201, 409, 400]).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(500);
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty('username', unique);
    }
  });

  test('Admin flow: login runtime-created admin, create technical user, assign new role, list municipality users', async () => {
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
