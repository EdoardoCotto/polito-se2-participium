const userRepository = require('../../server/repository/userRepository');

// Mock the DAO used by the repository
jest.mock('../../server/dao/userDao', () => ({
  getUserById: jest.fn(),
  getUser: jest.fn(),
  getUserByUsername: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUserTypeById: jest.fn(),
  findMunicipalityUsers: jest.fn(),
  updateUserProfile: jest.fn(),
  getExternalMaintainers: jest.fn(),
}));

const userDao = require('../../server/dao/userDao');
const NotFoundError = require('../../server/errors/NotFoundError');
const BadRequestError = require('../../server/errors/BadRequestError');
const ConflictError = require('../../server/errors/ConflictError');
const UnauthorizedError = require('../../server/errors/UnauthorizedError');

describe('userRepository.getUserById', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns the user if found', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    userDao.getUserById.mockResolvedValue(mockUser);

    const result = await userRepository.getUserById(1);

    expect(result).toEqual(mockUser);
    expect(userDao.getUserById).toHaveBeenCalledWith(1);
  });

  test('throws NotFoundError if user does not exist', async () => {
    userDao.getUserById.mockResolvedValue(null);

    await expect(userRepository.getUserById(99)).rejects.toThrow(NotFoundError);
  });
});

describe('userRepository.getUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('throws BadRequestError if username or password is missing', async () => {
    await expect(userRepository.getUser(null, null)).rejects.toThrow(BadRequestError);
  });

  test('throws NotFoundError if user credentials are invalid', async () => {
    userDao.getUser.mockResolvedValue(null);

    await expect(userRepository.getUser('foo', 'bar')).rejects.toThrow(NotFoundError);
  });

  test('returns the user if username and password are valid', async () => {
    const mockUser = { id: 1, username: 'foo' };
    userDao.getUser.mockResolvedValue(mockUser);

    const result = await userRepository.getUser('foo', 'bar');
    expect(result).toEqual(mockUser);
  });
});

describe('userRepository.createUser', () => {
  afterEach(() => jest.clearAllMocks());

  test('throws BadRequestError when required fields are missing', async () => {
    await expect(userRepository.createUser({ username: 'u' })).rejects.toThrow(BadRequestError);
  });

  test('throws ConflictError when username already exists', async () => {
    userDao.getUserByUsername.mockResolvedValue({ id: 1 });
    userDao.getUserByEmail.mockResolvedValue(null);
    await expect(userRepository.createUser({
      username: 'taken', email: 'new@example.com', name: 'N', surname: 'S', password: 'p'
    })).rejects.toThrow(ConflictError);
  });

  test('throws ConflictError when email already exists', async () => {
    userDao.getUserByUsername.mockResolvedValue(null);
    userDao.getUserByEmail.mockResolvedValue({ id: 2 });
    await expect(userRepository.createUser({
      username: 'newuser', email: 'exists@example.com', name: 'N', surname: 'S', password: 'p'
    })).rejects.toThrow(ConflictError);
  });

  test('returns created user on success', async () => {
    const input = { username: 'ok', email: 'ok@example.com', name: 'N', surname: 'S', password: 'p' };
    const created = { id: 10, ...input, type: 'citizen' };
    userDao.getUserByUsername.mockResolvedValue(null);
    userDao.getUserByEmail.mockResolvedValue(null);
    userDao.createUser.mockResolvedValue(created);
    const res = await userRepository.createUser(input);
    expect(userDao.createUser).toHaveBeenCalledWith(input);
    expect(res).toEqual(created);
  });
});

describe('userRepository.createUserIfAdmin', () => {
  afterEach(() => jest.clearAllMocks());

  const baseUser = { username: 'x', email: 'x@example.com', name: 'N', surname: 'S', password: 'p' };

  test('throws NotFoundError when admin does not exist', async () => {
    userDao.getUserById.mockResolvedValueOnce(null); // admin lookup
    await expect(userRepository.createUserIfAdmin(999, baseUser)).rejects.toThrow(NotFoundError);
  });

  test('throws UnauthorizedError when caller is not admin', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'citizen' });
    await expect(userRepository.createUserIfAdmin(1, baseUser)).rejects.toThrow(UnauthorizedError);
  });

  test('throws BadRequestError when required fields missing', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'admin' });
    await expect(userRepository.createUserIfAdmin(1, { username: 'only' })).rejects.toThrow(BadRequestError);
  });

  test('throws ConflictError when username exists', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'admin' });
    userDao.getUserByUsername.mockResolvedValueOnce({ id: 3 });
    await expect(userRepository.createUserIfAdmin(1, baseUser)).rejects.toThrow(ConflictError);
  });

  test('throws ConflictError when email exists', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'admin' });
    userDao.getUserByUsername.mockResolvedValueOnce(null);
    userDao.getUserByEmail.mockResolvedValueOnce({ id: 4 });
    await expect(userRepository.createUserIfAdmin(1, baseUser)).rejects.toThrow(ConflictError);
  });

  test('creates user with municipality_user type on success', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'admin' });
    userDao.getUserByUsername.mockResolvedValueOnce(null);
    userDao.getUserByEmail.mockResolvedValueOnce(null);
    userDao.createUser.mockResolvedValueOnce({ id: 10, ...baseUser, type: 'municipality_user' });
    const res = await userRepository.createUserIfAdmin(1, baseUser);
    expect(userDao.createUser).toHaveBeenCalledWith({ ...baseUser, type: 'municipality_user' });
    expect(res).toMatchObject({ id: 10, username: baseUser.username, type: 'municipality_user' });
  });
});

describe('userRepository.assignUserRole', () => {
  afterEach(() => jest.clearAllMocks());

  test('throws NotFoundError when admin not found', async () => {
    userDao.getUserById.mockResolvedValueOnce(null);
    await expect(userRepository.assignUserRole(1, 2, 'urban_planner')).rejects.toThrow(NotFoundError);
  });

  test('throws UnauthorizedError when caller is not admin', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'citizen' });
    await expect(userRepository.assignUserRole(1, 2, 'urban_planner')).rejects.toThrow(UnauthorizedError);
  });

  test('throws BadRequestError when role missing', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'admin' });
    await expect(userRepository.assignUserRole(1, 2, undefined)).rejects.toThrow(BadRequestError);
  });

  test('throws BadRequestError when role invalid', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'admin' });
    await expect(userRepository.assignUserRole(1, 2, 'invalid_role')).rejects.toThrow(BadRequestError);
  });

  test('throws NotFoundError when target user not found', async () => {
    userDao.getUserById
      .mockResolvedValueOnce({ id: 1, type: 'admin' }) // admin ok
      .mockResolvedValueOnce(null); // target missing
    await expect(userRepository.assignUserRole(1, 99, 'urban_planner')).rejects.toThrow(NotFoundError);
  });

  test('throws NotFoundError when update returns null', async () => {
    userDao.getUserById
      .mockResolvedValueOnce({ id: 1, type: 'admin' }) // admin ok
      .mockResolvedValueOnce({ id: 2, type: 'citizen' }); // target exists
    userDao.updateUserTypeById.mockResolvedValueOnce(null);
    await expect(userRepository.assignUserRole(1, 2, 'urban_planner')).rejects.toThrow(NotFoundError);
  });

  test('returns updated info on success', async () => {
    userDao.getUserById
      .mockResolvedValueOnce({ id: 1, type: 'admin' })
      .mockResolvedValueOnce({ id: 2, type: 'citizen' });
    userDao.updateUserTypeById.mockResolvedValueOnce({ id: 2, type: 'urban_planner' });
    const res = await userRepository.assignUserRole(1, 2, 'urban_planner');
    expect(userDao.updateUserTypeById).toHaveBeenCalledWith(2, 'urban_planner');
    expect(res).toEqual({ id: 2, type: 'urban_planner' });
  });
});

describe('userRepository.getMunicipalityUsers', () => {
  afterEach(() => jest.clearAllMocks());

  test('throws UnauthorizedError when admin missing', async () => {
    userDao.getUserById.mockResolvedValueOnce(null);
    await expect(userRepository.getMunicipalityUsers(1)).rejects.toThrow(UnauthorizedError);
  });

  test('throws UnauthorizedError when not an admin', async () => {
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'citizen' });
    await expect(userRepository.getMunicipalityUsers(1)).rejects.toThrow(UnauthorizedError);
  });

  test('returns list when admin', async () => {
    const list = [{ id: 3, type: 'urban_planner' }];
    userDao.getUserById.mockResolvedValueOnce({ id: 1, type: 'admin' });
    userDao.findMunicipalityUsers.mockResolvedValueOnce(list);
    const res = await userRepository.getMunicipalityUsers(1);
    expect(res).toEqual(list);
  });
});

describe('userRepository.updateUserProfile', () => {
  afterEach(() => jest.clearAllMocks());

  test('throws BadRequestError for non-integer userId', async () => {
    await expect(userRepository.updateUserProfile('1', {})).rejects.toThrow(BadRequestError);
    expect(userDao.updateUserProfile).not.toHaveBeenCalled();
  });

  test('throws NotFoundError when user not found (repo returns null)', async () => {
    const spy = jest.spyOn(userRepository, 'getUserById').mockResolvedValueOnce(null);
    await expect(userRepository.updateUserProfile(1, {})).rejects.toThrow(NotFoundError);
    expect(spy).toHaveBeenCalledWith(1);
    expect(userDao.updateUserProfile).not.toHaveBeenCalled();
  });

  test('throws BadRequestError for invalid photo extension', async () => {
    jest.spyOn(userRepository, 'getUserById').mockResolvedValueOnce({ id: 1 });
    await expect(
      userRepository.updateUserProfile(1, { personal_photo_path: 'avatar.gif' })
    ).rejects.toThrow(BadRequestError);
    expect(userDao.updateUserProfile).not.toHaveBeenCalled();
  });

  test('updates successfully with valid photo extension (case-insensitive)', async () => {
    jest.spyOn(userRepository, 'getUserById').mockResolvedValueOnce({ id: 1 });
    userDao.updateUserProfile.mockResolvedValueOnce({ id: 1, ok: true });
    const res = await userRepository.updateUserProfile(1, { personal_photo_path: 'avatar.JPG' });
    expect(userDao.updateUserProfile).toHaveBeenCalledWith(1, { personal_photo_path: 'avatar.JPG' });
    expect(res).toEqual({ id: 1, ok: true });
  });

  test('updates successfully without personal_photo_path', async () => {
    jest.spyOn(userRepository, 'getUserById').mockResolvedValueOnce({ id: 2 });
    userDao.updateUserProfile.mockResolvedValueOnce({ id: 2, name: 'New' });
    const payload = { name: 'New' };
    const res = await userRepository.updateUserProfile(2, payload);
    expect(userDao.updateUserProfile).toHaveBeenCalledWith(2, payload);
    expect(res).toEqual({ id: 2, name: 'New' });
  });
});

describe('userRepository.getExternalMaintainers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns list of external maintainers', async () => {
    const mockMaintainers = [{ id: 1, username: 'maintainer1', type: 'external_maintainer' }];
    userDao.getExternalMaintainers.mockResolvedValue(mockMaintainers);
    const result = await userRepository.getExternalMaintainers();
    expect(userDao.getExternalMaintainers).toHaveBeenCalled();
    expect(result).toEqual(mockMaintainers);
  });
});
