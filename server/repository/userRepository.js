const userDao = require('../dao/userDao')
const NotFoundError = require('../errors/NotFoundError')
const ConflictError = require('../errors/ConflictError')
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')
const { ALLOWED_ROLES } = require('../constants/roles')
const AppError = require('../errors/AppError')
const emailService = require('../services/emailService')


exports.getUserById = async (userId) => {
    const userNotMapped = await userDao.getUserById(userId);
    if (!userNotMapped || userNotMapped.length === 0) {
        throw new NotFoundError('User not found')
    }
    const firstRow = userNotMapped[0];
    const user = {
        id: firstRow.id,
        username: firstRow.username,
        email: firstRow.email,
        name: firstRow.name,
        surname: firstRow.surname,
        roles: userNotMapped.map(row => row.type),
        telegram_nickname: firstRow.telegram_nickname
    }
    return user
}

exports.getUser = async (username, password) => {
    if (!username || !password) {
        throw new BadRequestError('All fields are required')
    }
    const user = await userDao.getUser(username, password);
    if (!user) {
        throw new NotFoundError('Username or password incorrect');
    }
    // Check if user needs confirmation
    if (user.error === 'unconfirmed') {
        throw new UnauthorizedError('Please confirm your email address before logging in');
    }
    return user;
};

exports.createUser = async (user) => {
    try {
        if (!user.username || !user.email || !user.name || !user.surname || !user.password) {
            throw new BadRequestError('All fields are required');
        }
        const existingUsername = await userDao.getUserByUsername(user.username)
        const existingEmail = await userDao.getUserByEmail(user.email)
        if (existingUsername) {
            throw new ConflictError('Username already exists');
        }
        if (existingEmail) {
            throw new ConflictError('Email already exists');
        }
        const result = await userDao.createUser(user);
        
        // Send confirmation email if a confirmation code was generated (citizens only)
        if (result.confirmationCode) {
            try {
                await emailService.sendConfirmationEmail(
                    result.email,
                    result.name,
                    result.confirmationCode
                );
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
                // Don't fail registration if email fails, just log it
            }
        }
        
        // Don't return the confirmation code to the client (it's sent via email)
        const { confirmationCode, ...userWithoutCode } = result;
        return userWithoutCode;
    }
    catch (err) {
        console.error('Error in createUser repository:', err);
        throw err;
    }
}


exports.createUserIfAdmin = async (adminId, userToInsert) => {
    console.log('[DEBUG] createUserIfAdmin called with adminId:', adminId);
    
    const admin = await userDao.getUserById(adminId);
    
    console.log('[DEBUG] Admin object:', JSON.stringify(admin, null, 2));
    console.log('[DEBUG] Admin roles type:', typeof admin?.roles);
    console.log('[DEBUG] Admin roles value:', admin?.roles);
    
    if (!admin) {
        console.log('[DEBUG] Admin not found');
        throw new NotFoundError('Admin not found')
    }
    
    if (!admin.roles) {
        console.log('[DEBUG] Admin has no roles property');
        throw new UnauthorizedError('You are not an admin')
    }
    
    if (!admin.roles.includes('admin')) {
        console.log('[DEBUG] Admin roles does not include "admin":', admin.roles);
        throw new UnauthorizedError('You are not an admin')
    }
    
    console.log('[DEBUG] Admin check passed, proceeding with user creation');
    
    if (!userToInsert.username || !userToInsert.email || !userToInsert.name || !userToInsert.surname || !userToInsert.password) {
        throw new BadRequestError('All fields are required');
    }
    const existingUser = await userDao.getUserByUsername(userToInsert.username)
    const existingEmail = await userDao.getUserByEmail(userToInsert.email)
    if (existingUser) {
        throw new ConflictError('Username already exists');
    }
    if (existingEmail) {
        throw new ConflictError('Email already exists');
    }
    const userToCreate = { ...userToInsert, type: 'municipality_user' };
    const result = await userDao.createUser(userToCreate);
    return result;
}

/**
 * Assign a role/type to a user (admin only)
 * @param {number} adminId - acting admin user id
 * @param {number} targetUserId - user to update
 * @param {string} newType - new role (validated)
 * @returns {Promise<{id:number, type:string}>}
 */
exports.assignUserRole = async (adminId, targetUserId, newType) => {
    const admin = await userDao.getUserById(adminId);
    if (!admin) {
        throw new NotFoundError('Admin not found')
    }
    if (admin.type != 'admin') {
        throw new UnauthorizedError('You are not an admin')
    }
    if (!newType) {
        throw new BadRequestError('Role is required');
    }
    if (!ALLOWED_ROLES.includes(newType)) {
        throw new BadRequestError('Invalid role');
    }
    const target = await userDao.getUserById(targetUserId);
    if (!target) {
        throw new NotFoundError('User not found');
    }
    const updated = await userDao.updateUserTypeById(targetUserId, newType);
    if (!updated) {
        throw new NotFoundError('User not found');
    }
    return updated;
}


/**
 * Get all municipality users (admin-only).
 * Double-checks the acting user is an admin, even if the route is protected.
 */
exports.getMunicipalityUsers = async (adminId) => {
    const admin = await userDao.getUserById(adminId);
    if (!admin?.roles.includes('admin')) { // cambia da admin?.type a admin?.roles.includes()
        throw new UnauthorizedError('You are not an admin');
    }
    const users = await userDao.findMunicipalityUsers();
    return users;
};

exports.updateUserProfile = async (userId, updateData) => {
    if (!Number.isInteger(userId)){
        throw new BadRequestError('Invalid user id')
    }
    
    const user = await exports.getUserById(userId);
    if (!user){
        throw new NotFoundError('User not found');
    }

    if (updateData.personal_photo_path) {
        const validExtensions = ['.jpg', '.png', '.jpeg'];
        const fileExtension = updateData.personal_photo_path.toLowerCase().slice(updateData.personal_photo_path.lastIndexOf('.'));
        if (!validExtensions.includes(fileExtension)) {
            throw new BadRequestError('Invalid file extension');
        }
    }
    
    const result = await userDao.updateUserProfile(userId, updateData);
    return result;
}

/**
 * Get all external maintainers
 * @returns {Promise<Object[]>}
 */
exports.getExternalMaintainers = async () => {
    const maintainers = await userDao.getExternalMaintainers();
    return maintainers;
}

/**
 * Confirm user registration with confirmation code
 * @param {string} email - user email
 * @param {string} code - confirmation code
 * @returns {Promise<Object>}
 */
exports.confirmUser = async (email, code) => {
    if (!email || !code) {
        throw new BadRequestError('Email and confirmation code are required');
    }
    
    const result = await userDao.confirmUser(email, code);
    
    if (!result.success) {
        if (result.message === 'User not found') {
            throw new NotFoundError('User not found');
        } else if (result.message === 'Invalid confirmation code') {
            throw new BadRequestError('Invalid confirmation code');
        } else if (result.message === 'Confirmation code has expired') {
            throw new BadRequestError('Confirmation code has expired. Please request a new one');
        } else if (result.message === 'User is already confirmed') {
            throw new BadRequestError('User is already confirmed');
        } else {
            throw new BadRequestError(result.message);
        }
    }
    
    return result;
}

/**
 * Resend confirmation code
 * @param {string} email - user email
 * @returns {Promise<Object>}
 */
exports.resendConfirmationCode = async (email) => {
    if (!email) {
        throw new BadRequestError('Email is required');
    }
    
    const result = await userDao.resendConfirmationCode(email);
    
    if (!result.success) {
        if (result.message === 'User not found') {
            throw new NotFoundError('User not found');
        } else if (result.message === 'User is already confirmed') {
            throw new BadRequestError('User is already confirmed');
        } else {
            throw new BadRequestError(result.message);
        }
    }
    
    // Send new confirmation email
    try {
        await emailService.sendConfirmationEmail(
            result.email,
            result.name,
            result.confirmationCode
        );
    } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        throw new AppError('Failed to send confirmation email', 500);
    }
    
    return { success: true, message: 'Confirmation code sent to your email' };
}