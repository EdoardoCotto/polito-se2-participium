const NotFoundError = require('../errors/NotFoundError')
const ConflictError = require('../errors/ConflictError')
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return next(new UnauthorizedError('User not authenticated'));
    }
}

exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.type === 'admin') {
            return next();
        } else {
            return next(new UnauthorizedError('User is not admin'));
        }
    } else {
        return next(new UnauthorizedError('User not authenticated'));
    }
}
exports.isMunicipal_public_relations_officer = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.type === 'municipal_public_relations_officer') {
            return next();
        } else {
            return next(new UnauthorizedError('User is not admin'));
        }
    } else {
        return next(new UnauthorizedError('User not authenticated'));
    }
}

exports.isTechnicalOfficeStaff = (req, res, next) => {
    if (req.isAuthenticated()) {
        const { TECHNICAL_OFFICER_ROLES } = require('../constants/roles');
        if (TECHNICAL_OFFICER_ROLES.includes(req.user.type)) {
            return next();
        } else {
            return next(new UnauthorizedError('User is not a technical office staff member'));
        }
    } else {
        return next(new UnauthorizedError('User not authenticated'));
    }
}



exports.isExternalMaintainer = (req, res, next) => {
  // 1. Verifichiamo che l'utente sia loggato (req.user deve esistere)
  // 2. Verifichiamo il tipo. Nota: nello schema SQL hai scritto 'external_mantainer' (senza la 'i' dopo la 'n')
  if (req.user && req.user.type === 'external_maintainer') {
    return next(); // L'utente è autorizzato, passa al prossimo step (il controller)
  }

  // Se non corrisponde, restituiamo errore 403 (Forbidden)
  return res.status(403).json({ error: 'Access forbidden: external maintainer only' });
};

