const userRepository = require('../../server/repository/userRepository');

// Mock the DAO used by the repository
jest.mock('../../server/dao/userDao', () => ({
  getUserById: jest.fn(),
  getUser: jest.fn(),
  getUserByUsername: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

const userDao = require('../../server/dao/userDao');
const NotFoundError = require('../../server/errors/NotFoundError');
const BadRequestError = require('../../server/errors/BadRequestError');

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
