// test/unit/commentDao.test.js
// Mock sqlite3 before requiring commentDao
const mockDb = {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
  };
  
  jest.mock('sqlite3', () => ({
    Database: jest.fn(() => mockDb),
  }));
  
  const commentDao = require('../../server/dao/commentDao');
  
  describe('commentDao', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('createComment', () => {
      it('should create a comment and return it with author details', async () => {
        const reportId = 1;
        const authorId = 2;
        const commentText = 'This needs urgent attention';
  
        const mockCommentRow = {
          id: 1,
          reportId: reportId,
          comment: commentText,
          created_at: '2025-01-01 10:00:00',
          authorId: authorId,
          name: 'John',
          surname: 'Doe',
          authorRole: 'urban_planner',
        };
  
        // Mock db.run to call the callback with success
        mockDb.run.mockImplementation((sql, params, callback) => {
          callback.call({ lastID: 1 }, null);
        });
  
        // Mock db.get to return the created comment
        mockDb.get.mockImplementation((sql, params, callback) => {
          callback(null, mockCommentRow);
        });
  
        const result = await commentDao.createComment(reportId, authorId, commentText);
  
        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO InternalComments'),
          [reportId, authorId, commentText],
          expect.any(Function)
        );
  
        expect(mockDb.get).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [1],
          expect.any(Function)
        );
  
        expect(result).toEqual(mockCommentRow);
      });
  
      it('should reject when insert fails', async () => {
        const reportId = 1;
        const authorId = 2;
        const commentText = 'Test';
  
        const error = new Error('Insert failed');
  
        mockDb.run.mockImplementation((sql, params, callback) => {
          callback.call({ lastID: 1 }, error);
        });
  
        await expect(commentDao.createComment(reportId, authorId, commentText)).rejects.toThrow('Insert failed');
      });
  
      it('should reject when select fails after insert', async () => {
        const reportId = 1;
        const authorId = 2;
        const commentText = 'Test';
  
        const error = new Error('Select failed');
  
        mockDb.run.mockImplementation((sql, params, callback) => {
          callback.call({ lastID: 1 }, null);
        });
  
        mockDb.get.mockImplementation((sql, params, callback) => {
          callback(error, null);
        });
  
        await expect(commentDao.createComment(reportId, authorId, commentText)).rejects.toThrow('Select failed');
      });
    });
  
    describe('getCommentsByReportId', () => {
      it('should return all comments for a report with author details', async () => {
        const reportId = 1;
  
        const mockComments = [
          {
            id: 1,
            reportId: reportId,
            comment: 'First comment',
            created_at: '2025-01-01 10:00:00',
            authorId: 2,
            name: 'John',
            surname: 'Doe',
            authorRole: 'urban_planner',
          },
          {
            id: 2,
            reportId: reportId,
            comment: 'Second comment',
            created_at: '2025-01-01 11:00:00',
            authorId: 3,
            name: 'Jane',
            surname: 'Smith',
            authorRole: 'environmental_services',
          },
        ];
  
        mockDb.all.mockImplementation((sql, params, callback) => {
          callback(null, mockComments);
        });
  
        const result = await commentDao.getCommentsByReportId(reportId);
  
        expect(mockDb.all).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [reportId],
          expect.any(Function)
        );
  
        expect(result).toEqual(mockComments);
      });
  
      it('should return empty array when no comments found', async () => {
        const reportId = 999;
  
        mockDb.all.mockImplementation((sql, params, callback) => {
          callback(null, []);
        });
  
        const result = await commentDao.getCommentsByReportId(reportId);
  
        expect(result).toEqual([]);
      });
  
      it('should return empty array when rows is null', async () => {
        const reportId = 999;
  
        mockDb.all.mockImplementation((sql, params, callback) => {
          callback(null, null);
        });
  
        const result = await commentDao.getCommentsByReportId(reportId);
  
        expect(result).toEqual([]);
      });
  
      it('should reject when database query fails', async () => {
        const reportId = 1;
        const error = new Error('Database error');
  
        mockDb.all.mockImplementation((sql, params, callback) => {
          callback(error, null);
        });
  
        await expect(commentDao.getCommentsByReportId(reportId)).rejects.toThrow('Database error');
      });
    });
  });
  