const { errorHandler } = require('../../server/middlewares/errorMiddleware');
const AppError = require('../../server/errors/AppError');

describe('errorMiddleware.errorHandler', () => {
	let req, res, next;
	beforeEach(() => {
		req = {};
		next = jest.fn();
		res = {
			status: jest.fn(function(code){ this.statusCode = code; return this; }),
			json: jest.fn(function(payload){ this.body = payload; return this; })
		};
	});

	it('returns AppError status & message', () => {
		const err = new AppError('Bad stuff', 418);
		errorHandler(err, req, res, next);
		expect(res.status).toHaveBeenCalledWith(418);
		expect(res.json).toHaveBeenCalledWith({ error: 'Bad stuff' });
	});

	it('returns 500 for generic errors', () => {
		const err = new Error('Boom');
		errorHandler(err, req, res, next);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
	});
});
