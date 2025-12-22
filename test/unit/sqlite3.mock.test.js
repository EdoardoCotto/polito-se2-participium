"use strict";

// Unit tests to cover __mock__/sqlite3.js behaviours

describe('__mock__/sqlite3', () => {
  let sqlite;

  beforeEach(() => {
    jest.resetModules();
    // Load the actual mock module by path to avoid any virtual overrides
    sqlite = require(require.resolve('../../__mock__/sqlite3.js'));
  });

  test('Database constructor invokes callback asynchronously', async () => {
    const called = [];
    const db = new sqlite.Database('path.db', (err) => { called.push(err); });
    expect(db).toBeDefined();
    // Wait for microtasks flushed via process.nextTick
    await new Promise((r) => process.nextTick(r));
    expect(called).toEqual([null]);
  });

  test('serialize executes provided function', () => {
    const db = new sqlite.Database('x');
    let ran = false;
    db.serialize(() => { ran = true; });
    expect(ran).toBe(true);
  });

  test('serialize with non-function does nothing', () => {
    const db = new sqlite.Database('x');
    // Should not throw or change anything
    expect(() => db.serialize(null)).not.toThrow();
  });

  test('close invokes callback asynchronously', async () => {
    const db = new sqlite.Database('x');
    const called = [];
    db.close((err) => called.push(err));
    await new Promise((r) => setImmediate(r));
    expect(called).toEqual([null]);
  });

  test('close without callback does nothing', () => {
    const db = new sqlite.Database('x');
    expect(() => db.close()).not.toThrow();
  });

  test('exec runs statements sequentially', async () => {
    const db = new sqlite.Database('x');
    sqlite.Database.mockRun.mockReset();
    sqlite.Database.mockRun.mockImplementation((_stmt, cb) => cb(null));
    const ran = [];
    await new Promise((resolve) => {
      db.exec('CREATE A; CREATE B;', (err) => { ran.push(err); resolve(); });
    });
    expect(ran).toEqual([null]);
    expect(sqlite.Database.mockRun).toHaveBeenCalledTimes(2);
    expect(sqlite.Database.mockRun.mock.calls[0][0]).toBe('CREATE A');
    expect(sqlite.Database.mockRun.mock.calls[1][0]).toBe('CREATE B');
  });

  test('exec without callback still runs', async () => {
    const db = new sqlite.Database('x');
    sqlite.Database.mockRun.mockReset();
    sqlite.Database.mockRun.mockImplementation((_stmt, cb) => cb(null));
    await expect(
      new Promise((resolve, reject) => {
        try {
          db.exec('ONE; TWO;');
          // Allow microtasks to flush
          setImmediate(resolve);
        } catch (e) {
          reject(e);
        }
      })
    ).resolves.toBeUndefined();
    expect(sqlite.Database.mockRun).toHaveBeenCalledTimes(2);
  });

  test('exec propagates error from mockRun', async () => {
    const db = new sqlite.Database('x');
    sqlite.Database.mockRun.mockReset();
    sqlite.Database.mockRun
      .mockImplementationOnce((_stmt, cb) => cb(null))
      .mockImplementationOnce((_stmt, cb) => cb(new Error('boom')));
    const received = [];
    await new Promise((resolve) => {
      db.exec('ONE; TWO;', (err) => { received.push(err); resolve(); });
    });
    expect(received[0]).toBeInstanceOf(Error);
    expect(received[0].message).toBe('boom');
  });

  test('verbose returns module exports', () => {
    const api = sqlite.verbose();
    expect(api.Database).toBe(sqlite.Database);
  });
});
