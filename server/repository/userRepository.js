const userDao = require('../dao/userDao')

exports.getUserById() = async (userId) => {
    try {
        const user = await userDao.getUserById(userId);
        if (!user) {
            throw new Error('User not found')
        }
        return user
    }
    catch(err){
        console.error('Error in userRepository:', err.message);
        throw err;
    }
}


exports.createUserIfAdmin = async (userId) => {
    
}