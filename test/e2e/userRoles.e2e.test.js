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
async function initializeDatabase() {
  const { resetDatabase } = require('../../server/db/init');
  await resetDatabase();
}

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

describe('PT10: User Roles Management E2E Tests', () => {

  test('Admin can add role to municipality user', async () => {
    jest.setTimeout(10000); // Increase timeout for this test
    // Create admin
    const adminU = `admin_roles_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'Roles',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user
    const muniU = `muni_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'Municipality',
      surname: 'User',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(201);
    const muniUserId = createRes.body.id;

    // Add role to municipality user
    const addRoleRes = await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'urban_planner' });
    expect(addRoleRes.statusCode).toBe(200);
    
    // Verify role was added by fetching the user
    const muniRes = await agent.get('/api/users/municipality');
    expect(muniRes.statusCode).toBe(200);
    const user = muniRes.body.find(u => u.id === muniUserId);
    expect(user).toBeDefined();
    expect(user.roles).toContain('urban_planner');
  });

  test('Admin can add multiple roles to municipality user', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_multi_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'Multi',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user
    const muniU = `muni_multi_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'Multi',
      surname: 'Role',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(201);
    const muniUserId = createRes.body.id;

    // Add first role
    const addRole1Res = await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'urban_planner' });
    expect(addRole1Res.statusCode).toBe(200);

    // Add second role
    const addRole2Res = await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'public_works_engineer' });
    expect(addRole2Res.statusCode).toBe(200);

    // Add third role
    const addRole3Res = await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'building_inspector' });
    expect(addRole3Res.statusCode).toBe(200);

    // Verify all roles were added by fetching the user
    const muniRes = await agent.get('/api/users/municipality');
    expect(muniRes.statusCode).toBe(200);
    const user = muniRes.body.find(u => u.id === muniUserId);
    expect(user).toBeDefined();
    expect(user.roles).toContain('urban_planner');
    expect(user.roles).toContain('public_works_engineer');
    expect(user.roles).toContain('building_inspector');
    expect(user.roles.length).toBe(3);
  });

  test('Admin can remove role from municipality user', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_remove_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'Remove',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user
    const muniU = `muni_remove_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'Remove',
      surname: 'Test',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(201);
    const muniUserId = createRes.body.id;

    // Add role first
    const addRoleRes = await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'urban_planner' });
    expect(addRoleRes.statusCode).toBe(200);

    // Verify role was added
    let muniRes = await agent.get('/api/users/municipality');
    let user = muniRes.body.find(u => u.id === muniUserId);
    expect(user.roles).toContain('urban_planner');

    // Remove role
    const removeRoleRes = await agent.delete(`/api/users/${muniUserId}/remove-role`).send({ role: 'urban_planner' });
    expect(removeRoleRes.statusCode).toBe(200);
    
    // Verify role was removed
    muniRes = await agent.get('/api/users/municipality');
    user = muniRes.body.find(u => u.id === muniUserId);
    expect(user.roles).not.toContain('urban_planner');
  });

  test('Admin can remove one role while keeping others (multiple roles)', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_partial_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'Partial',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user
    const muniU = `muni_partial_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'Partial',
      surname: 'Remove',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(201);
    const muniUserId = createRes.body.id;

    // Add multiple roles
    await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'urban_planner' });
    await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'public_works_engineer' });
    await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'building_inspector' });

    // Verify all roles are present
    const muniRes = await agent.get('/api/users/municipality');
    expect(muniRes.statusCode).toBe(200);
    const user = muniRes.body.find(u => u.id === muniUserId);
    expect(user.roles).toContain('urban_planner');
    expect(user.roles).toContain('public_works_engineer');
    expect(user.roles).toContain('building_inspector');

    // Remove one role
    const removeRoleRes = await agent.delete(`/api/users/${muniUserId}/remove-role`).send({ role: 'urban_planner' });
    expect(removeRoleRes.statusCode).toBe(200);

    // Verify the role was removed but others remain
    const muniRes2 = await agent.get('/api/users/municipality');
    const user2 = muniRes2.body.find(u => u.id === muniUserId);
    expect(user2.roles).not.toContain('urban_planner');
    expect(user2.roles).toContain('public_works_engineer');
    expect(user2.roles).toContain('building_inspector');
  });

  test('Non-admin cannot add or remove roles (403)', async () => {
    jest.setTimeout(10000);
    // Create a citizen
    const citizenU = `cit_roles_${Date.now()}`;
    const citizen = await userDao.createUser({
      username: citizenU,
      email: `${citizenU}@example.com`,
      name: 'Citizen',
      surname: 'Test',
      password: 'Password123!',
      skipConfirmation: true
    });

    // Login as citizen
    const loginRes = await agent.post('/api/sessions').send({ username: citizenU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user (via admin endpoint - should fail)
    const muniU = `muni_forbidden_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'Forbidden',
      surname: 'Test',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(401);

    // Try to add role (should fail)
    const addRoleRes = await agent.post(`/api/users/${citizen.id}/assign-role`).send({ role: 'urban_planner' });
    expect(addRoleRes.statusCode).toBe(401);

    // Try to remove role (should fail)
    const removeRoleRes = await agent.delete(`/api/users/${citizen.id}/remove-role`).send({ role: 'urban_planner' });
    expect(removeRoleRes.statusCode).toBe(401);
  });

  test('Cannot add duplicate role (409)', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_duplicate_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'Duplicate',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user
    const muniU = `muni_duplicate_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'Duplicate',
      surname: 'Test',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(201);
    const muniUserId = createRes.body.id;

    // Add role first time
    const addRole1Res = await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'urban_planner' });
    expect(addRole1Res.statusCode).toBe(200);

    // Try to add same role again (should fail with 409)
    const addRole2Res = await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'urban_planner' });
    expect(addRole2Res.statusCode).toBe(409);
    expect(addRole2Res.body).toHaveProperty('error');
    expect(addRole2Res.body.error).toContain('already has this role');
  });

  test('Cannot remove role that user does not have (404 or 409)', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_norole_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'NoRole',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user
    const muniU = `muni_norole_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'NoRole',
      surname: 'Test',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(201);
    const muniUserId = createRes.body.id;

    // Try to remove role that doesn't exist (should fail)
    const removeRoleRes = await agent.delete(`/api/users/${muniUserId}/remove-role`).send({ role: 'urban_planner' });
    expect([404, 409]).toContain(removeRoleRes.statusCode);
    expect(removeRoleRes.body).toHaveProperty('error');
  });

  test('Cannot add role to non-municipality user (400)', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_invalid_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'Invalid',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a citizen
    const citizenU = `cit_invalid_${Date.now()}`;
    const citizen = await userDao.createUser({
      username: citizenU,
      email: `${citizenU}@example.com`,
      name: 'Citizen',
      surname: 'Invalid',
      password: 'Password123!',
      skipConfirmation: true
    });

    // Try to add role to citizen (should fail with 400)
    const addRoleRes = await agent.post(`/api/users/${citizen.id}/assign-role`).send({ role: 'urban_planner' });
    expect(addRoleRes.statusCode).toBe(400);
    expect(addRoleRes.body).toHaveProperty('error');
    expect(addRoleRes.body.error).toContain('municipality users');
  });

  test('Invalid role is rejected (400)', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_invalidrole_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'InvalidRole',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user
    const muniU = `muni_invalidrole_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'InvalidRole',
      surname: 'Test',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(201);
    const muniUserId = createRes.body.id;

    // Try to add invalid role (should fail with 400)
    const addRoleRes = await agent.post(`/api/users/${muniUserId}/assign-role`).send({ role: 'invalid_role_name' });
    expect(addRoleRes.statusCode).toBe(400);
    expect(addRoleRes.body).toHaveProperty('error');
  });

  test('Missing role in request body is rejected (400)', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_missingrole_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'MissingRole',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Create a municipality user
    const muniU = `muni_missingrole_${Date.now()}`;
    const createRes = await agent.post('/api/users/admin').send({
      username: muniU,
      email: `${muniU}@example.com`,
      name: 'MissingRole',
      surname: 'Test',
      password: 'Password123!'
    });
    expect(createRes.statusCode).toBe(201);
    const muniUserId = createRes.body.id;

    // Try to add role without role field (should fail with 400)
    const addRoleRes = await agent.post(`/api/users/${muniUserId}/assign-role`).send({});
    expect(addRoleRes.statusCode).toBe(400);
    expect(addRoleRes.body).toHaveProperty('error');
  });

  test('Non-existent user returns 404', async () => {
    jest.setTimeout(10000);
    // Create admin
    const adminU = `admin_notfound_${Date.now()}`;
    await userDao.createUser({
      username: adminU,
      email: `${adminU}@example.com`,
      name: 'Admin',
      surname: 'NotFound',
      password: 'Password123!',
      skipConfirmation: true,
      type: 'admin'
    });

    // Login as admin
    const loginRes = await agent.post('/api/sessions').send({ username: adminU, password: 'Password123!' });
    expect(loginRes.statusCode).toBe(200);

    // Try to add role to non-existent user (should fail with 404)
    const fakeUserId = 99999;
    const addRoleRes = await agent.post(`/api/users/${fakeUserId}/assign-role`).send({ role: 'urban_planner' });
    expect(addRoleRes.statusCode).toBe(404);
    expect(addRoleRes.body).toHaveProperty('error');
  });
});

