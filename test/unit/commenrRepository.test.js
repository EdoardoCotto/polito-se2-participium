// test/unit/commentRepository.test.js
jest.mock('../../server/dao/commentDao');
jest.mock('../../server/dao/reportDao');

const commentRepository = require('../../server/repository/commentRepository');
const commentDao = require('../../server/dao/commentDao');
const reportDao = require('../../server/dao/reportDao');
const BadRequestError = require('../../server/errors/BadRequestError');
const NotFoundError = require('../../server/errors/NotFoundError');

describe('commentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addComment', () => {
    it('should add a comment successfully', async () => {
      const reportId = 123;
      const authorId = 1;
      const text = 'This is a test comment';

      reportDao.getReportById.mockResolvedValue({ id: 123, title: 'Test Report' });
      commentDao.createComment.mockResolvedValue({
        id: 1,
        reportId,
        authorId,
        comment: text,
      });

      const result = await commentRepository.addComment(reportId, authorId, text);

      expect(reportDao.getReportById).toHaveBeenCalledWith(reportId);
      expect(commentDao.createComment).toHaveBeenCalledWith(reportId, authorId, text);
      expect(result).toEqual({
        id: 1,
        reportId,
        authorId,
        comment: text,
      });
    });

    it('should trim whitespace from comment text', async () => {
      const reportId = 123;
      const authorId = 1;
      const text = '  This is a test comment  ';

      reportDao.getReportById.mockResolvedValue({ id: 123 });
      commentDao.createComment.mockResolvedValue({
        id: 1,
        reportId,
        authorId,
        comment: text.trim(),
      });

      await commentRepository.addComment(reportId, authorId, text);

      expect(commentDao.createComment).toHaveBeenCalledWith(reportId, authorId, text.trim());
    });

    it('should throw BadRequestError for invalid reportId', async () => {
      await expect(commentRepository.addComment(null, 1, 'test')).rejects.toThrow(BadRequestError);
      await expect(commentRepository.addComment(null, 1, 'test')).rejects.toThrow('Invalid Report ID');
    });

    it('should throw BadRequestError for non-integer reportId', async () => {
      await expect(commentRepository.addComment(12.5, 1, 'test')).rejects.toThrow(BadRequestError);
      await expect(commentRepository.addComment(12.5, 1, 'test')).rejects.toThrow('Invalid Report ID');
    });

    it('should throw BadRequestError for empty comment text', async () => {
      await expect(commentRepository.addComment(123, 1, '')).rejects.toThrow(BadRequestError);
      await expect(commentRepository.addComment(123, 1, '')).rejects.toThrow('Comment text is required');
    });

    it('should throw BadRequestError for whitespace-only comment text', async () => {
      await expect(commentRepository.addComment(123, 1, '   ')).rejects.toThrow(BadRequestError);
      await expect(commentRepository.addComment(123, 1, '   ')).rejects.toThrow('Comment text is required');
    });

    it('should throw BadRequestError for non-string comment text', async () => {
      await expect(commentRepository.addComment(123, 1, null)).rejects.toThrow(BadRequestError);
      await expect(commentRepository.addComment(123, 1, null)).rejects.toThrow('Comment text is required');
    });

    it('should throw NotFoundError when report does not exist', async () => {
      reportDao.getReportById.mockResolvedValue(null);

      await expect(commentRepository.addComment(999, 1, 'test')).rejects.toThrow(NotFoundError);
      await expect(commentRepository.addComment(999, 1, 'test')).rejects.toThrow('Report not found');
    });
  });

  describe('getComments', () => {
    it('should get comments successfully', async () => {
      const reportId = 123;
      const mockComments = [
        { id: 1, reportId, authorId: 1, comment: 'Comment 1' },
        { id: 2, reportId, authorId: 2, comment: 'Comment 2' },
      ];

      reportDao.getReportById.mockResolvedValue({ id: 123 });
      commentDao.getCommentsByReportId.mockResolvedValue(mockComments);

      const result = await commentRepository.getComments(reportId);

      expect(reportDao.getReportById).toHaveBeenCalledWith(reportId);
      expect(commentDao.getCommentsByReportId).toHaveBeenCalledWith(reportId);
      expect(result).toEqual(mockComments);
    });

    it('should throw BadRequestError for invalid reportId', async () => {
      await expect(commentRepository.getComments(null)).rejects.toThrow(BadRequestError);
      await expect(commentRepository.getComments(null)).rejects.toThrow('Invalid Report ID');
    });

    it('should throw BadRequestError for non-integer reportId', async () => {
      await expect(commentRepository.getComments(12.5)).rejects.toThrow(BadRequestError);
      await expect(commentRepository.getComments(12.5)).rejects.toThrow('Invalid Report ID');
    });

    it('should throw NotFoundError when report does not exist', async () => {
      reportDao.getReportById.mockResolvedValue(null);

      await expect(commentRepository.getComments(999)).rejects.toThrow(NotFoundError);
      await expect(commentRepository.getComments(999)).rejects.toThrow('Report not found');
    });
  });
});
