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

      const mockReport = {
        id: 1,
        officerId: 2,
        external_maintainerId: 3
      };

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

      // Mock db.get to return the report first, then the created comment
      let callCount = 0;
      mockDb.get.mockImplementation((sql, params, callback) => {
        callCount++;
        if (callCount === 1) {
          // First call: check report assignment
          callback(null, mockReport);
        } else {
          // Second call: return the created comment
          callback(null, mockCommentRow);
        }
      });

      const result = await commentDao.createComment(reportId, authorId, commentText);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO InternalComments'),
        [reportId, authorId, commentText],
        expect.any(Function)
      );

      expect(result).toEqual(mockCommentRow);
    });
  
    it('should reject when insert fails', async () => {
      const reportId = 1;
      const authorId = 2;
      const commentText = 'Test';

      const mockReport = {
        id: 1,
        officerId: 2,
        external_maintainerId: 3
      };

      const error = new Error('Insert failed');

      // First db.get returns the report
      mockDb.get.mockImplementation((sql, params, callback) => {
        callback(null, mockReport);
      });

      mockDb.run.mockImplementation((sql, params, callback) => {
        callback.call({ lastID: 1 }, error);
      });

      await expect(commentDao.createComment(reportId, authorId, commentText)).rejects.toThrow('Insert failed');
    });
  
    it('should reject when select fails after insert', async () => {
      const reportId = 1;
      const authorId = 2;
      const commentText = 'Test';

      const mockReport = {
        id: 1,
        officerId: 2,
        external_maintainerId: 3
      };

      const error = new Error('Select failed');

      mockDb.run.mockImplementation((sql, params, callback) => {
        callback.call({ lastID: 1 }, null);
      });

      // First db.get returns the report, second fails
      let callCount = 0;
      mockDb.get.mockImplementation((sql, params, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(null, mockReport);
        } else {
          callback(error, null);
        }
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
  
    describe('createComment - Authorization scenarios', () => {
      it('should reject when report is not found', async () => {
        const reportId = 999;
        const authorId = 2;
        const commentText = 'Test comment';
  
        // Mock db.get to return no report (undefined)
        mockDb.get.mockImplementation((sql, params, callback) => {
          callback(null, undefined);
        });
  
        await expect(commentDao.createComment(reportId, authorId, commentText)).rejects.toThrow('ReportNotFound');
      });
  
      it('should reject when checking report fails', async () => {
        const reportId = 1;
        const authorId = 2;
        const commentText = 'Test comment';
        const error = new Error('Database error');
  
        // Mock db.get to fail
        mockDb.get.mockImplementation((sql, params, callback) => {
          callback(error, null);
        });
  
        await expect(commentDao.createComment(reportId, authorId, commentText)).rejects.toThrow('Database error');
      });
  
      it('should reject when user is not assigned to report (not officer or maintainer)', async () => {
        const reportId = 1;
        const authorId = 5; // Not the assigned officer or maintainer
        const commentText = 'Unauthorized comment';
  
        const mockReport = {
          id: 1,
          officerId: 2,
          external_maintainerId: 3
        };
  
        // First db.get returns the report
        mockDb.get.mockImplementation((sql, params, callback) => {
          callback(null, mockReport);
        });
  
        await expect(commentDao.createComment(reportId, authorId, commentText)).rejects.toThrow('UnauthorizedComment');
      });
  
      it('should create comment when user is the assigned officer', async () => {
        const reportId = 1;
        const authorId = 2; // The assigned officer
        const commentText = 'Officer comment';
  
        const mockReport = {
          id: 1,
          officerId: 2,
          external_maintainerId: 3
        };
  
        const mockCommentRow = {
          id: 1,
          reportId: reportId,
          comment: commentText,
          created_at: '2025-01-01 10:00:00',
          authorId: authorId,
          name: 'Officer',
          surname: 'Name',
          authorRole: 'urban_planner',
        };
  
        // First db.get returns the report
        // Second db.get returns the created comment
        let callCount = 0;
        mockDb.get.mockImplementation((sql, params, callback) => {
          callCount++;
          if (callCount === 1) {
            callback(null, mockReport);
          } else {
            callback(null, mockCommentRow);
          }
        });
  
        mockDb.run.mockImplementation((sql, params, callback) => {
          callback.call({ lastID: 1 }, null);
        });
  
        const result = await commentDao.createComment(reportId, authorId, commentText);
        expect(result).toEqual(mockCommentRow);
      });
  
      it('should create comment when user is the assigned maintainer', async () => {
        const reportId = 1;
        const authorId = 3; // The assigned maintainer
        const commentText = 'Maintainer comment';
  
        const mockReport = {
          id: 1,
          officerId: 2,
          external_maintainerId: 3
        };
  
        const mockCommentRow = {
          id: 2,
          reportId: reportId,
          comment: commentText,
          created_at: '2025-01-01 11:00:00',
          authorId: authorId,
          name: 'Maintainer',
          surname: 'Name',
          authorRole: 'external_maintainer',
        };
  
        // First db.get returns the report
        // Second db.get returns the created comment
        let callCount = 0;
        mockDb.get.mockImplementation((sql, params, callback) => {
          callCount++;
          if (callCount === 1) {
            callback(null, mockReport);
          } else {
            callback(null, mockCommentRow);
          }
        });
  
        mockDb.run.mockImplementation((sql, params, callback) => {
          callback.call({ lastID: 2 }, null);
        });
  
        const result = await commentDao.createComment(reportId, authorId, commentText);
        expect(result).toEqual(mockCommentRow);
      });
    });
  });
  