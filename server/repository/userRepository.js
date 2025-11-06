const userDao = require('../dao/userDao')
const NotFoundError = require('../errors/NotFoundError')
const ConflictError = require('../errors/ConflictError')
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')


exports.getUserById = async (userId) => {
    try {
        const user = await userDao.getUserById(userId);
        if (!user) {
            throw new NotFoundError('User not found')
        }
        return user
    }
    catch(err){
        console.error('Internal Server Error', err.message);
        throw err;
    }
}

exports.getUser = async (username, password) => {
  try {
    if (!username || !password){
        throw new BadRequestError('All fields are required')
    }
    const user = await userDao.getUser(username, password);
    if (!user) {
      throw new NotFoundError('Username or password incorrect');
    }
    return user;
  } catch (err) {
    console.error('Internal Server Error', err.message);
    throw err;
  }
};

exports.createUser = async (user) => {
    try {
        if (!user.username || !user.email || !user.name || !user.surname || !user.password) {
            throw new BadRequestError('All fields are required');
        }
        const existingUser = await userDao.getUserByUsername(user.username)
        if (!existingUser){
            await userDao.createUser(user)
        }
        else {
            throw new ConflictError('User with that username already exists')
        }
    }
    catch (err) {
    console.error('Internal Server Error', err.message);
    throw err;
  }
}


exports.createUserIfAdmin = async (adminId, userToInsert) => {
    try {
        const admin = await userDao.getUserById(adminId);
        if (!admin) {
            throw new NotFoundError('Admin not found')
        }
        if (admin.type != 'admin'){
            throw new UnauthorizedError('You are not an admin')
        }
        if (!userToInsert.username || !userToInsert.email || !userToInsert.name || !userToInsert.surname || !userToInsert.password) {
            throw new BadRequestError('All fields are required');
        }
        const existingUser = await userDao.getUserByUsername(userToInsert.username)
        if (!existingUser){
            await userDao.createUser(userToInsert)
        }
        else {
            throw new ConflictError('User with that username already exists')
        }
    }
    catch (err) {
        console.error('Internal Server Error', err.message);
        throw err;
  }
}