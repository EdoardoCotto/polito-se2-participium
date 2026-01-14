const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');
const UnauthorizedError = require('../errors/UnauthorizedError');

// Importiamo le costanti dal tuo file roles.js
const { TECHNICAL_OFFICER_ROLES } = require('../constants/roles');

// NOTE: external_maintainer is now a USER TYPE (not a role)
// External maintainers have type='external_maintainer' and are associated with a company
// TECHNICAL_OFFICER_ROLES now only contains internal municipality roles

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return next(new UnauthorizedError('User not authenticated'));
};

exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new UnauthorizedError('User not authenticated'));
    }
    // 'admin' è ancora salvato nel campo 'type' della tabella Users nel tuo schema SQL
    if (req.user.type === 'admin') {
        return next();
    }
    return next(new UnauthorizedError('User is not admin'));
};

exports.isMunicipal_public_relations_officer = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new UnauthorizedError('User not authenticated'));
    }

    const userRoles = req.user.roles || [];

    if (userRoles.includes('municipal_public_relations_officer')) {
        return next();
    }
    return next(new UnauthorizedError('User is not a public relations officer'));
};

exports.isTechnicalOfficeStaff = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new UnauthorizedError('User not authenticated'));
    }

    const userRoles = req.user.roles || [];

    // Verifica se l'utente ha uno dei ruoli tecnici (municipality_user with technical roles)
    const isInternalTech = userRoles.some(role => TECHNICAL_OFFICER_ROLES.includes(role));

    if (isInternalTech) {
        return next();
    }
    return next(new UnauthorizedError('User is not a technical office staff member'));
};

exports.isExternalMaintainer = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new UnauthorizedError('User not authenticated'));
    }

    // external_maintainer is now a USER TYPE, not a role
    if (req.user.type === 'external_maintainer') {
        return next();
    }

    // 403 Forbidden because the user is authenticated but doesn't have the right type
    return res.status(403).json({ error: 'Access forbidden: external maintainer only' });
};

/**
 * Middleware to allow both technical office staff and external maintainers
 * Used for generic access to technical reports (PT26)
 */
exports.isInternalStaffOrMaintainer = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new UnauthorizedError('User not authenticated'));
    }

    const userRoles = req.user.roles || [];

    // Check if user is a technical office staff (municipality_user with technical roles)
    const isTechnicalStaff = userRoles.some(role => TECHNICAL_OFFICER_ROLES.includes(role));

    // Check if user is an external maintainer (by type)
    const isExternalMaintainer = req.user.type === 'external_maintainer';

    // Admin can also access
    const isAdmin = req.user.type === 'admin';

    if (isTechnicalStaff || isExternalMaintainer || isAdmin) {
        return next();
    }

    return next(new UnauthorizedError('Access forbidden: technical office staff or external maintainer only'));
};

exports.isTechnicalOfficeStaffOrAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next(new UnauthorizedError('User not authenticated'));
  }

  // Check if user is admin
  if (req.user.type === 'admin') {
    return next();
  }

  // Check if user has technical office roles
  const userRoles = req.user.roles || [];
  const isTechnicalStaff = userRoles.some(role => TECHNICAL_OFFICER_ROLES.includes(role));

  if (isTechnicalStaff) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied: requires technical office staff or admin privileges' });
};