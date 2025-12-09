// test/unit/commentController.test.js
jest.mock('../../server/repository/commentRepository', () => ({
    addComment: jest.fn(),
    getComments: jest.fn(),
  }));
  
  const commentController = require('../../server/controller/commentController');
  const commentRepository = require('../../server/repository/commentRepository');
  const AppError = require('../../server/errors/AppError');
  
  const mkRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  };
  
  describe('commentController', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('createComment', () => {
      it('should create a comment successfully', async () => {
        const req = {
          params: { id: '123' },
          body: { comment: 'This is a test comment' },
          user: { id: 1 },
        };
        const res = mkRes();
  
        const mockResult = {
          id: 1,
          reportId: 123,
          authorId: 1,
          comment: 'This is a test comment',
        };
  
        commentRepository.addComment.mockResolvedValue(mockResult);
  
        await commentController.createComment(req, res);
  
        expect(commentRepository.addComment).toHaveBeenCalledWith(123, 1, 'This is a test comment');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockResult);
      });
  
      it('should handle AppError', async () => {
        const req = {
          params: { id: '123' },
          body: { comment: 'Test' },
          user: { id: 1 },
        };
        const res = mkRes();
  
        const error = new AppError('Report not found', 404);
        commentRepository.addComment.mockRejectedValue(error);
  
        await commentController.createComment(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Report not found' });
      });
  
      it('should handle generic error', async () => {
        const req = {
          params: { id: '123' },
          body: { comment: 'Test' },
          user: { id: 1 },
        };
        const res = mkRes();
  
        commentRepository.addComment.mockRejectedValue(new Error('Database error'));
  
        await commentController.createComment(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
  
    describe('getComments', () => {
      it('should get comments successfully', async () => {
        const req = {
          params: { id: '123' },
        };
        const res = mkRes();
  
        const mockComments = [
          { id: 1, reportId: 123, authorId: 1, comment: 'Comment 1' },
          { id: 2, reportId: 123, authorId: 2, comment: 'Comment 2' },
        ];
  
        commentRepository.getComments.mockResolvedValue(mockComments);
  
        await commentController.getComments(req, res);
  
        expect(commentRepository.getComments).toHaveBeenCalledWith(123);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockComments);
      });
  
      it('should handle AppError', async () => {
        const req = {
          params: { id: '123' },
        };
        const res = mkRes();
  
        const error = new AppError('Report not found', 404);
        commentRepository.getComments.mockRejectedValue(error);
  
        await commentController.getComments(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Report not found' });
      });
  
      it('should handle generic error', async () => {
        const req = {
          params: { id: '123' },
        };
        const res = mkRes();
  
        commentRepository.getComments.mockRejectedValue(new Error('Database error'));
  
        await commentController.getComments(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
  });
  