const userController = require('../../server/controller/userController');

describe('User Controller - integration tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 1 },
      body: { username: 'alice', email: 'a@example.com', name: 'Alice', surname: 'Liddell', password: 'password123' },
      user: { id: 10, type: 'admin' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getUserById returns user if exists', async () => {
    await userController.getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1, username: expect.any(String) }));
  });

  test('createUserIfAdmin creates user when admin', async () => {
    await userController.createUserIfAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ username: expect.any(String) }));
  });
});
