const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');
const UnauthorizedError = require('../errors/UnauthorizedError');

// Importiamo le costanti dal tuo file roles.js
const { TECHNICAL_OFFICER_ROLES } = require('../constants/roles');

// Definiamo il ruolo specifico del manutentore esterno
const ROLE_EXTERNAL_MAINTAINER = 'external_maintainer';

// Definiamo i ruoli "Interni" filtrando via il manutentore esterno dalla lista tecnica
// (Questo serve per isTechnicalOfficeStaff che presume sia personale interno)
const INTERNAL_TECHNICAL_ROLES = TECHNICAL_OFFICER_ROLES.filter(
    role => role !== ROLE_EXTERNAL_MAINTAINER
);

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
    
    // Verifica se l'utente ha uno dei ruoli tecnici INTERNI (escluso external_maintainer)
    const isInternalTech = userRoles.some(role => INTERNAL_TECHNICAL_ROLES.includes(role));

    if (isInternalTech) {
        return next();
    }
    return next(new UnauthorizedError('User is not a technical office staff member'));
};

exports.isExternalMaintainer = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new UnauthorizedError('User not authenticated'));
    }

    const userRoles = req.user.roles || [];

    if (userRoles.includes(ROLE_EXTERNAL_MAINTAINER)) {
        return next();
    }

    // Qui usiamo 403 Forbidden perché l'utente è autenticato ma non ha il ruolo giusto
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

    // Poiché nel tuo file roles.js TECHNICAL_OFFICER_ROLES include GIÀ 'external_maintainer',
    // qui basta controllare se l'utente ha un qualsiasi ruolo presente in quella lista.
    const hasAccess = userRoles.some(role => TECHNICAL_OFFICER_ROLES.includes(role));

    // Aggiungiamo anche l'admin per sicurezza (spesso l'admin deve vedere tutto)
    const isAdmin = req.user.type === 'admin';

    if (hasAccess || isAdmin) {
        return next();
    }

    return next(new UnauthorizedError('Access forbidden: technical office staff or external maintainer only'));
};