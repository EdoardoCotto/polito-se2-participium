// test/unit/commentDao.test.js
const commentDao = require('../../server/dao/commentDao');

describe('commentDao', () => {
  describe('createComment', () => {
    it('should create a comment and return it with author details', async () => {
      const reportId = 1;
      const authorId = 2; // urban_planner
      const commentText = 'This needs urgent attention';

      const result = await commentDao.createComment(reportId, authorId, commentText);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.reportId).toBe(reportId);
      expect(result.comment).toBe(commentText);
      expect(result.authorId).toBe(authorId);
      expect(result.name).toBeDefined();
      expect(result.surname).toBeDefined();
      expect(result.authorRole).toBeDefined();
      expect(result.created_at).toBeDefined();
    });

    it('should reject with error for invalid reportId', async () => {
      await expect(commentDao.createComment(9999, 2, 'test')).rejects.toThrow();
    });
  });

  describe('getCommentsByReportId', () => {
    it('should return all comments for a report with author details', async () => {
      const reportId = 1;
      const authorId = 2;

      // First create a comment
      await commentDao.createComment(reportId, authorId, 'Test comment');

      const comments = await commentDao.getCommentsByReportId(reportId);

      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeGreaterThan(0);

      const comment = comments[comments.length - 1];
      expect(comment.reportId).toBe(reportId);
      expect(comment.comment).toBe('Test comment');
      expect(comment.authorId).toBeDefined();
      expect(comment.name).toBeDefined();
      expect(comment.surname).toBeDefined();
      expect(comment.authorRole).toBeDefined();
      expect(comment.created_at).toBeDefined();
    });

    it('should return empty array for report with no comments', async () => {
      const comments = await commentDao.getCommentsByReportId(9999);

      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBe(0);
    });

    it('should return comments ordered by created_at ASC', async () => {
      const reportId = 1;

      // Create multiple comments
      await commentDao.createComment(reportId, 2, 'First comment');
      await new Promise(resolve => setTimeout(resolve, 10));
      await commentDao.createComment(reportId, 3, 'Second comment');
      await new Promise(resolve => setTimeout(resolve, 10));
      await commentDao.createComment(reportId, 2, 'Third comment');

      const comments = await commentDao.getCommentsByReportId(reportId);

      expect(comments.length).toBeGreaterThanOrEqual(3);

      // Check that timestamps are in ascending order
      for (let i = 1; i < comments.length; i++) {
        const prevTime = new Date(comments[i - 1].created_at).getTime();
        const currTime = new Date(comments[i].created_at).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });
});
