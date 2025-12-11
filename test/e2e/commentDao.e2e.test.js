// test/e2e/commentDao.e2e.test.js
// Ensure real sqlite3 in E2E: bypass moduleNameMapper
jest.resetModules();
jest.unmock('sqlite3');
jest.doMock('sqlite3', () => {
  const real = jest.requireActual('sqlite3');
  const moduleWithVerbose = typeof real.verbose === 'function' ? real : { ...real, verbose: () => real };
  // Polyfill Database.exec if missing: run statements sequentially
  try {
    const TestDb = new moduleWithVerbose.Database(':memory:');
    const hasExec = typeof TestDb.exec === 'function';
    TestDb.close();
    if (!hasExec) {
      const OriginalDatabase = moduleWithVerbose.Database;
      moduleWithVerbose.Database = function(...args) {
        const db = new OriginalDatabase(...args);
        if (typeof db.exec !== 'function') {
          db.exec = (sql, cb) => {
            const statements = String(sql)
              .split(';')
              .map(s => s.trim())
              .filter(s => s.length);
            const runSequentially = async () => {
              for (const stmt of statements) {
                await new Promise((res, rej) => db.run(stmt, (err) => (err ? rej(err) : res())));
              }
            };
            runSequentially().then(() => cb && cb(null)).catch(err => cb && cb(err));
          };
        }
        return db;
      };
      // preserve prototype methods
      moduleWithVerbose.Database.prototype = OriginalDatabase.prototype;
    }
  } catch {}
  return moduleWithVerbose;
}, { virtual: true });
// Stub fs to avoid unlink EBUSY during resetDatabase in E2E
jest.doMock('node:fs', () => {
  const real = jest.requireActual('node:fs');
  return { ...real, existsSync: () => false, unlinkSync: () => {} };
});

jest.setTimeout(30000);

async function initializeDatabase() {
  const { resetDatabase } = require('../../server/db/init');
  await resetDatabase();
}

let commentDao;
let userDao;
let reportDao;
let sharedReportId;

beforeAll(async () => {
  await initializeDatabase();
  commentDao = require('../../server/dao/commentDao');
  userDao = require('../../server/dao/userDao');
  reportDao = require('../../server/dao/reportDao');

  // Create test users
  await userDao.createUser({ username: 'testuser1', email: 'test1@example.com', name: 'Test', surname: 'User1', password: 'password123', type: 'citizen' });
  await userDao.createUser({ username: 'testuser2', email: 'test2@example.com', name: 'Test', surname: 'User2', password: 'password123', type: 'urban_planner' });
  await userDao.createUser({ username: 'testuser3', email: 'test3@example.com', name: 'Test', surname: 'User3', password: 'password123', type: 'external_maintainer' });

  // Create a test report for comments
  const createdReport = await reportDao.createReport({
    userId: 1,
    latitude: 45.0703,
    longitude: 7.6869,
    title: 'Test Report',
    description: 'A test report for comment testing',
    category: 'Roads and Urban Furnishings',
    photos: ['test1.jpg']
  });
  sharedReportId = createdReport.id;

  // Assign the report to the urban planner (authorId 2) and also to external maintainer (id 3)
  await reportDao.updateReportReview(sharedReportId, {
    status: 'assigned',
    technicalOffice: 'urban_planner',
    officerId: 2,
  });
  await reportDao.assignReportToExternalMaintainer(sharedReportId, 3);
});

describe('commentDao', () => {
  describe('createComment', () => {
    it('should create a comment and return it with author details', async () => {
      const reportId = sharedReportId;
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

    it('should reject when creating comment for non-existent reportId', async () => {
      await expect(commentDao.createComment(9999, 2, 'test')).rejects.toThrow('ReportNotFound');
    });
  });

  describe('getCommentsByReportId', () => {
    it('should return all comments for a report with author details', async () => {
      const reportId = sharedReportId;
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
      const comments = await commentDao.getCommentsByReportId(8888);

      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBe(0);
    });

    it('should return comments ordered by created_at ASC', async () => {
      const reportId = sharedReportId;

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
