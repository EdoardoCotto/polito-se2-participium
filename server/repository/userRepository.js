const userDao = require('../dao/userDao')
const NotFoundError = require('../errors/NotFoundError')
const ConflictError = require('../errors/ConflictError')
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')
const { ALLOWED_ROLES } = require('../constants/roles')
const AppError = require('../errors/AppError')
const emailService = require('../services/emailService')


exports.getUserById = async (userId) => {
    console.log('[REPO getUserById] START - userId:', userId);
    const userNotMapped = await userDao.getUserById(userId);
    
    console.log('[REPO getUserById] userNotMapped:', userNotMapped);
    console.log('[REPO getUserById] userNotMapped type:', typeof userNotMapped);
    console.log('[REPO getUserById] userNotMapped length:', userNotMapped?.length);
    
    if (!userNotMapped) {
        console.log('[REPO getUserById] User not found, throwing error');
        throw new NotFoundError('User not found')
    }

    console.log('[REPO getUserById] firstRow:', firstRow);
    const user = {
        id: userNotMapped.id,
        username: userNotMapped.username,
        email: userNotMapped.email,
        name: userNotMapped.name,
        surname: userNotMapped.surname,
        type: userNotMapped.type,
        roles: userNotMapped.map(row => row.role),
        telegram_nickname: userNotMapped.telegram_nickname,
        personal_photo_path: userNotMapped.personal_photo_path, // Aggiungi questo
        mail_notifications: userNotMapped.mail_notifications      // Aggiungi questo
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
    
    if (admin.type !== 'admin') {
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
 * Get all municipality users (admin-only).
 * Double-checks the acting user is an admin, even if the route is protected.
 */
exports.getMunicipalityUsers = async (adminId) => {
    const admin = await userDao.getUserById(adminId);
    if (admin?.type !== 'admin') {
        throw new UnauthorizedError('You are not an admin');
    }
    const users = await userDao.findMunicipalityUsers();
    return users;
};

exports.updateUserProfile = async (userId, updateData) => {
    console.log('[REPO updateUserProfile] START - userId:', userId);
    console.log('[REPO updateUserProfile] updateData:', updateData);
    
    if (!Number.isInteger(userId)){
        console.log('[REPO updateUserProfile] Invalid user id');
        throw new BadRequestError('Invalid user id')
    }
    
    console.log('[REPO updateUserProfile] Calling getUserById...');
    const user = await exports.getUserById(userId);
    console.log('[REPO updateUserProfile] getUserById returned:', user);
    
    if (!user){
        console.log('[REPO updateUserProfile] User not found');
        throw new NotFoundError('User not found');
    }

    if (updateData.personal_photo_path) {
        console.log('[REPO updateUserProfile] Validating photo extension...');
        const validExtensions = ['.jpg', '.png', '.jpeg'];
        const fileExtension = updateData.personal_photo_path.toLowerCase().slice(updateData.personal_photo_path.lastIndexOf('.'));
        if (!validExtensions.includes(fileExtension)) {
            console.log('[REPO updateUserProfile] Invalid file extension:', fileExtension);
            throw new BadRequestError('Invalid file extension');
        }
        console.log('[REPO updateUserProfile] Photo extension valid:', fileExtension);
    }
    
    console.log('[REPO updateUserProfile] Calling DAO updateUserProfile...');
    const result = await userDao.updateUserProfile(userId, updateData);
    console.log('[REPO updateUserProfile] END - DAO returned:', result);
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

exports.deleteRoleFromUser = async (adminId, targetUserId, roleToRemove) => {
    const admin = await userDao.getUserById(adminId);
    console.log('roleToRemove:', roleToRemove);
    if (!admin) {
        throw new NotFoundError('Admin not found')
    }
    if (admin.type !== 'admin') {
        throw new UnauthorizedError('You are not an admin')
    }
    const target = await userDao.getUserById(targetUserId);
    console.log('target user:', target);
    if (!target) {
        throw new NotFoundError('User not found');
    }
    if (target.type !== 'municipality_user') {
        throw new BadRequestError('Roles can only be removed from municipality users');
    }
    if (!target.roles.includes(roleToRemove)) {
        throw new ConflictError('User does not have this role');
    }
    if (!roleToRemove) {
        throw new BadRequestError('Role is required');
    }
    if (!ALLOWED_ROLES.includes(roleToRemove)) {
        throw new BadRequestError('Invalid role');
    }
    const result = await userDao.deleteRoleFromUser(targetUserId, roleToRemove);
    return result;
}

exports.addRoleToUser = async (adminId, targetUserId, roleToAdd) => {
    const admin = await userDao.getUserById(adminId);
    if (!admin) {
        throw new NotFoundError('Admin not found')
    }
    if (admin.type !== 'admin') {
        throw new UnauthorizedError('You are not an admin')
    }
    const target = await userDao.getUserById(targetUserId);
    if (!target) {
        throw new NotFoundError('User not found');
    }
    if (target.type !== 'municipality_user') {
        throw new BadRequestError('Roles can only be assigned to municipality users');
    }
    if (target.roles.includes(roleToAdd)) {
        throw new ConflictError('User already has this role');
    }
    if (!roleToAdd) {
        throw new BadRequestError('Role is required');
    }
    console.log('[DEBUG] roleToAdd:', roleToAdd);
    if (!ALLOWED_ROLES.includes(roleToAdd)) {
        throw new BadRequestError('Invalid role');
    }
    const result = await userDao.addRoleToUser(targetUserId, roleToAdd);
    return result;
}