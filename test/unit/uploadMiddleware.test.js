"use strict";

const fs = require("fs");
const path = require("path");

// Mock multer prima di richiederlo
jest.mock("multer", () => {
  const multerFn = jest.fn((options) => {
    multerFn.lastOptions = options; // salva le opzioni per i test
    return {
      array: jest.fn(() => function mockedMulterArray() {}),
    };
  });

  // diskStorage restituisce lo stesso oggetto, così possiamo ispezionare .destination e .filename
  multerFn.diskStorage = jest.fn((opts) => opts);

  return multerFn;
});

const multer = require("multer");

// Mock fs e path
jest.mock("fs");
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  extname: jest.fn((filename) => {
    const parts = filename.split(".");
    return parts.length > 1 ? "." + parts.pop() : "";
  }),
}));

// Require del middleware *dopo* i mock
let uploadMiddleware;

describe("uploadMiddleware", () => {
  const uploadDirMatcher = expect.stringMatching(/static[\\/]+uploads$/);

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    uploadMiddleware = require("../../server/middlewares/uploadMiddleware");
  });

  it("should create upload directory if it does not exist", () => {
    expect(fs.existsSync).toHaveBeenCalledWith(uploadDirMatcher);
    expect(fs.mkdirSync).toHaveBeenCalledWith(uploadDirMatcher, { recursive: true });
  });

  it("should configure multer with proper limits and array field", () => {
    expect(uploadMiddleware).toBeInstanceOf(Function);
    const multerArgs = multer.lastOptions;
    expect(multerArgs.limits.fileSize).toBe(1024 * 1024 * 5);
  });

  describe("fileFilter behavior", () => {
    let fileFilter;

    beforeEach(() => {
      fileFilter = multer.lastOptions.fileFilter;
    });

    it("should accept image files", () => {
      const file = { mimetype: "image/png" };
      const cb = jest.fn();
      fileFilter({}, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should reject non-image files", () => {
      const file = { mimetype: "text/plain" };
      const cb = jest.fn();
      fileFilter({}, file, cb);
      expect(cb).toHaveBeenCalled();
      const err = cb.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain("Invalid file type");
    });
  });

  describe("storage configuration", () => {
    let storage;

    beforeEach(() => {
      storage = multer.lastOptions.storage;
    });

    it("should set correct destination folder", () => {
      const cb = jest.fn();
      storage.destination({}, {}, cb);
      expect(cb).toHaveBeenCalledWith(null, uploadDirMatcher);
    });

    it("should generate a unique filename with correct extension", () => {
      const cb = jest.fn();
      const file = { fieldname: "photos", originalname: "test.png" };

      const DateNowSpy = jest.spyOn(Date, "now").mockReturnValue(123456);
      Math.random = jest.fn(() => 0.123456789);

      storage.filename({}, file, cb);
      const generatedName = cb.mock.calls[0][1];

      expect(generatedName).toMatch(/^photos-\d+-\d+\.png$/);
      DateNowSpy.mockRestore();
    });
  });
});
