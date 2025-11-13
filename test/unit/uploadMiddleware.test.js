"use strict";

const path = require("path");

// mock di fs
jest.mock("fs", () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
}));

// mock di multer (definito dentro jest.mock!)
jest.mock("multer", () => {
  const mockMulter = jest.fn((opts) => {
    mockMulter.lastOptions = opts;
    return {
      array: jest.fn().mockImplementation(() => "mockArrayMiddleware"),
    };
  });

  mockMulter.diskStorage = jest.fn((config) => {
    mockMulter.diskStorageConfig = config;
    return config;
  });

  return mockMulter;
});

const fs = require("fs");
const mockMulter = require("multer");

// ricarica il modulo dopo aver impostato i mock
const uploadMiddleware = require("../../server/middlewares/uploadMiddleware");

describe("uploadMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create upload directory if it does not exist", () => {
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join(__dirname, "../../server/static/uploads"),
      { recursive: true }
    );
  });

  it("should configure multer with proper limits and array field", () => {
    expect(uploadMiddleware).toBeDefined();

    const opts = mockMulter.lastOptions;
    expect(opts).toBeDefined();
    expect(opts.limits.fileSize).toBe(1024 * 1024 * 5);
    expect(typeof opts.fileFilter).toBe("function");
    expect(opts.storage).toBeDefined();
  });

  describe("fileFilter behavior", () => {
    let fileFilter;

    beforeEach(() => {
      fileFilter = mockMulter.lastOptions?.fileFilter;
    });

    it("should accept image files", () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: "image/png" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should reject non-image files", () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: "text/plain" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });

  describe("storage configuration", () => {
    let storageConfig;

    beforeEach(() => {
      storageConfig = mockMulter.diskStorageConfig;
    });

    it("should set correct destination folder", () => {
      const folder = path.join(__dirname, "../../server/static/uploads");
      const cb = jest.fn();
      storageConfig.destination(null, null, cb);
      expect(cb).toHaveBeenCalledWith(null, folder);
    });

    it("should generate a unique filename with correct extension", () => {
      const file = { fieldname: "photo", originalname: "test.jpg" };
      const cb = jest.fn();

      storageConfig.filename(null, file, cb);
      const [[, , generatedName]] = cb.mock.calls;
      expect(generatedName).toMatch(/^photo-\d+-\d+\.jpg$/);
    });
  });
});
