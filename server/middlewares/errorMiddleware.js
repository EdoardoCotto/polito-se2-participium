const AppError = require('../errors/AppError');

exports.errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    // Log the actual error for debugging
    console.error('Unhandled error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ error: 'Internal Server Error' });
};