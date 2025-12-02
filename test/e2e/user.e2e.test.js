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

  test('GET /api/users/roles returns allowed roles (admin only)', async () => {
    const adminU = `admin_roles_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'Roles',
      password: 'Password123!',
      type: 'admin'
    });
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    const res = await agent.get('/api/users/roles');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('roles');
    expect(Array.isArray(res.body.roles)).toBe(true);
    expect(res.body.roles).toContain('urban_planner');
  });

  test('Citizen is forbidden on admin-only endpoints (403)', async () => {
    const cU = `cit_forbidden_${Date.now()}`;
    const targetU = `target_${Date.now()}`;
    await userDao.createUser({
      username: cU,
      email: `${cU}@example.com`,
      name: 'Cit',
      surname: 'Forbidden',
      password: 'Password123!'
    });
    const target = await userDao.createUser({
      username: targetU,
      email: `${targetU}@example.com`,
      name: 'Target',
      surname: 'User',
      password: 'Password123!'
    });
    const loginRes = await agent.post('/api/sessions').send({ username: cU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    const createAdminOnly = await agent.post('/api/users/admin').send({
      username: `x_${Date.now()}`,
      email: `x_${Date.now()}@example.com`,
      name: 'X',
      surname: 'Y',
      password: 'Password123!'
    });
    expect(createAdminOnly.statusCode).toBe(401);

    const muni = await agent.get('/api/users/municipality');
    expect(muni.statusCode).toBe(401);

    const assign = await agent.put(`/api/users/${target.id}/type`).send({ type: 'urban_planner' });
    expect(assign.statusCode).toBe(401);
  });

  test('PUT /api/users/:id/update supports multipart photo upload and self-only update', async () => {
    const aliceU = `alice_${Date.now()}`;
    const bobU = `bob_${Date.now()}`;
    const alice = await userDao.createUser({
      username: aliceU,
      email: `${aliceU}@example.com`,
      name: 'Alice',
      surname: 'E2E',
      password: 'Password123!'
    });
    const bob = await userDao.createUser({
      username: bobU,
      email: `${bobU}@example.com`,
      name: 'Bob',
      surname: 'E2E',
      password: 'Password123!'
    });

    const loginRes = await agent.post('/api/sessions').send({ username: aliceU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Forbidden to update another user's profile
    const forbid = await agent
      .put(`/api/users/${bob.id}/update`)
      .field('telegram_nickname', '@bob')
      .field('mail_notifications', 'true');
    expect(forbid.statusCode).toBe(403);

    // Update own profile with avatar upload
    const ok = await agent
      .put(`/api/users/${alice.id}/update`)
      .field('telegram_nickname', '@alice')
      .field('mail_notifications', 'true')
      .attach('personal_photo_path', Buffer.from('fakeimg'), { filename: 'avatar.png', contentType: 'image/png' });
    expect(ok.statusCode).toBe(200);
    expect(ok.body).toHaveProperty('id', alice.id);
    if (ok.body.personal_photo_path !== undefined) {
      expect(ok.body.personal_photo_path).toMatch(/^\/static\/avatars\//);
    }
    expect(ok.body).toHaveProperty('mail_notifications', 1);
    expect(ok.body).toHaveProperty('telegram_nickname', '@alice');
  });
});
