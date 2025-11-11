// Full unit coverage for userController with repository mocked
jest.mock('../../server/repository/userRepository', () => ({
  getUserById: jest.fn(),
  getUser: jest.fn(),
  assignUserRole: jest.fn(),
  createUser: jest.fn(),
  createUserIfAdmin: jest.fn(),
  getMunicipalityUsers: jest.fn(),
}));

const userController = require('../../server/controller/userController');
const userRepository = require('../../server/repository/userRepository');
const AppError = require('../../server/errors/AppError');
const { ALLOWED_ROLES, ROLE_METADATA } = require('../../server/constants/roles');

describe('userController', () => {
  let req;
  let res;

  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  beforeEach(() => {
    req = {
      params: { id: 1 },
      body: {
        username: 'alice',
        email: 'a@example.com',
        name: 'Alice',
        surname: 'Liddell',
        password: 'password123',
      },
      user: { id: 10, type: 'admin' },
    };
    res = makeRes();
    jest.clearAllMocks();
  });

  // getUserById
  it('getUserById -> 200 OK', async () => {
    const fake = { id: 1, username: 'alice' };
    userRepository.getUserById.mockResolvedValueOnce(fake);
    await userController.getUserById(req, res);
    expect(userRepository.getUserById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fake);
  });

  it('getUserById -> AppError mapped to status', async () => {
    userRepository.getUserById.mockRejectedValueOnce(new AppError('Not found', 404));
    await userController.getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('getUserById -> unknown error -> 500', async () => {
    userRepository.getUserById.mockRejectedValueOnce(new Error('boom'));
    await userController.getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  // getUser (login)
  it('getUser -> 200 OK', async () => {
    const logged = { id: 2, username: 'bob' };
    userRepository.getUser.mockResolvedValueOnce(logged);
    await userController.getUser({ body: { username: 'bob', password: 'pw' } }, res);
    expect(userRepository.getUser).toHaveBeenCalledWith('bob', 'pw');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(logged);
  });

  it('getUser -> 400 BadRequest when body missing', async () => {
    // Simula BadRequestError (estende AppError) dal repository
    userRepository.getUser.mockRejectedValueOnce(new AppError('All fields are required', 400));
    await userController.getUser({}, res); // body undefined
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'All fields are required' });
  });

  it('getUser -> AppError mapped to status', async () => {
    userRepository.getUser.mockRejectedValueOnce(new AppError('Unauthorized', 401));
    await userController.getUser({ body: { username: 'x', password: 'y' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('getUser -> unknown error -> 500', async () => {
    userRepository.getUser.mockRejectedValueOnce(new Error('down'));
    await userController.getUser({ body: { username: 'x', password: 'y' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  // assignUserRole
  it('assignUserRole -> 400 when id invalid', async () => {
    const badReq = { ...req, params: { id: 'abc' } };
    await userController.assignUserRole(badReq, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user id' });
  });

  it('assignUserRole -> 400 when type missing', async () => {
    const noTypeReq = { ...req, body: {} };
    await userController.assignUserRole(noTypeReq, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Role (type) is required' });
  });

  it('assignUserRole -> 400 when body undefined', async () => {
    const undefinedBodyReq = { ...req };
    delete undefinedBodyReq.body; // simulate missing body property entirely
    await userController.assignUserRole(undefinedBodyReq, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Role (type) is required' });
  });

  it('assignUserRole -> 200 OK', async () => {
    const updated = { id: 1, type: 'urban_planner' };
    userRepository.assignUserRole.mockResolvedValueOnce(updated);
    const goodReq = { ...req, params: { id: 1 }, body: { type: 'urban_planner' } };
    await userController.assignUserRole(goodReq, res);
    expect(userRepository.assignUserRole).toHaveBeenCalledWith(10, 1, 'urban_planner');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('assignUserRole -> AppError mapped to status', async () => {
    userRepository.assignUserRole.mockRejectedValueOnce(new AppError('Forbidden', 403));
    const goodReq = { ...req, params: { id: 1 }, body: { type: 'urban_planner' } };
    await userController.assignUserRole(goodReq, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('assignUserRole -> unknown error -> 500', async () => {
    userRepository.assignUserRole.mockRejectedValueOnce(new Error('db'));
    const goodReq = { ...req, params: { id: 1 }, body: { type: 'urban_planner' } };
    await userController.assignUserRole(goodReq, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  // getAllowedRoles
  it('getAllowedRoles -> 200 returns roles and metadata', async () => {
    await userController.getAllowedRoles({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ roles: ALLOWED_ROLES, metadata: ROLE_METADATA });
  });

  // createUser (public registration)
  it('createUser -> 201 Created', async () => {
    const created = { id: 5, username: 'alice' };
    userRepository.createUser.mockResolvedValueOnce(created);
    await userController.createUser(req, res);
    expect(userRepository.createUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('createUser -> AppError mapped to status', async () => {
    userRepository.createUser.mockRejectedValueOnce(new AppError('Conflict', 409));
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conflict' });
  });

  it('createUser -> unknown error -> 500', async () => {
    userRepository.createUser.mockRejectedValueOnce(new Error('oops'));
    await userController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  // createUserIfAdmin
  it('createUserIfAdmin -> 201 Created', async () => {
    const created = { id: 6, username: 'carol' };
    userRepository.createUserIfAdmin.mockResolvedValueOnce(created);
    await userController.createUserIfAdmin(req, res);
    expect(userRepository.createUserIfAdmin).toHaveBeenCalledWith(10, req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('createUserIfAdmin -> AppError mapped to status', async () => {
    userRepository.createUserIfAdmin.mockRejectedValueOnce(new AppError('Forbidden', 403));
    await userController.createUserIfAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('createUserIfAdmin -> unknown error -> 500', async () => {
    userRepository.createUserIfAdmin.mockRejectedValueOnce(new Error('err'));
    await userController.createUserIfAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  // getMunicipalityUsers
  it('getMunicipalityUsers -> 200 OK', async () => {
    const users = [
      { id: 7, type: 'urban_planner' },
      { id: 8, type: 'building_inspector' },
    ];
    userRepository.getMunicipalityUsers.mockResolvedValueOnce(users);
    await userController.getMunicipalityUsers(req, res);
    expect(userRepository.getMunicipalityUsers).toHaveBeenCalledWith(10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
  });

  it('getMunicipalityUsers -> AppError mapped to status', async () => {
    userRepository.getMunicipalityUsers.mockRejectedValueOnce(new AppError('Forbidden', 403));
    await userController.getMunicipalityUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('getMunicipalityUsers -> unknown error -> 500', async () => {
    userRepository.getMunicipalityUsers.mockRejectedValueOnce(new Error('db'));
    await userController.getMunicipalityUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
