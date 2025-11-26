"use strict";

const path = require("path");

// utilizzeremo degli spy sul modulo reale fs

// mock di multer (definito dentro jest.mock!)
jest.mock("multer", () => {
  const mockMulter = jest.fn((opts) => {
    mockMulter.lastOptions = opts;
    const instance = {
      array: jest.fn((field, max) => {
        mockMulter.lastArrayArgs = [field, max];
        const fn = function mockArrayMiddleware(req, res, next) { next && next(); };
        return fn;
      }),
      single: jest.fn().mockImplementation(() => {
        const fn = function mockSingleMiddleware(req, res, next) { next && next(); };
        return fn;
      }),
    };
    mockMulter.lastInstance = instance;
    if (!mockMulter.instances) mockMulter.instances = [];
    mockMulter.instances.push(instance);
    return instance;
  });

  mockMulter.diskStorage = jest.fn((config) => {
    mockMulter.diskStorageConfig = config;
    if (!mockMulter.diskStorageConfigs) mockMulter.diskStorageConfigs = [];
    mockMulter.diskStorageConfigs.push(config);
    return config;
  });

  return mockMulter;
});

const fs = require("fs");
const mockMulter = require("multer");

// carica il middleware in un modulo isolato per garantire l'uso dei mock
let uploadMiddleware;
let initialStorageConfig;
let initialProfileStorageConfig;
let firstUploadInstance;
jest.isolateModules(() => {
  uploadMiddleware = require("../../server/middlewares/uploadMiddleware");
  // Capture the diskStorage configuration objects from the initial module load
  initialStorageConfig = mockMulter.diskStorage.mock.calls[0]?.[0];
  initialProfileStorageConfig = mockMulter.diskStorage.mock.calls[1]?.[0];
  // Capture the first multer instance (used for upload)
  firstUploadInstance = mockMulter.mock.results[0]?.value;
});

describe("uploadMiddleware", () => {
  // Nessun beforeEach: evitiamo di azzerare i conteggi delle chiamate iniziali fs.existsSync/mkdirSync

  it("should create upload directory if it does not exist", () => {
    // prepara gli spy
    const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});
    // esegui il modulo in ambiente isolato così da forzare nuova valutazione
    const modulePath = require.resolve("../../server/middlewares/uploadMiddleware");
    jest.isolateModules(() => {
      require(modulePath);
    });
    const expectedDir = path.join(path.dirname(modulePath), "..", "static", "uploads");
    expect(existsSpy).toHaveBeenCalledWith(expectedDir);
    expect(mkdirSpy).toHaveBeenCalledWith(expectedDir, { recursive: true });
    existsSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  it("should create profile directory if it does not exist", () => {
    const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});
    const modulePath = require.resolve("../../server/middlewares/uploadMiddleware");
    jest.isolateModules(() => {
      require(modulePath);
    });
    const expectedDir = path.join(path.dirname(modulePath), "..", "static", "avatars");
    expect(existsSpy).toHaveBeenCalledWith(expectedDir);
    expect(mkdirSpy).toHaveBeenCalledWith(expectedDir, { recursive: true });
    existsSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  it("should NOT create directories when they already exist", () => {
    const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
    const mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});
    const modulePath = require.resolve("../../server/middlewares/uploadMiddleware");
    jest.isolateModules(() => {
      require(modulePath);
    });
    expect(mkdirSpy).not.toHaveBeenCalled();
    existsSpy.mockRestore();
    mkdirSpy.mockRestore();
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
      storageConfig = initialStorageConfig;
    });

    it("should set correct destination folder", () => {
      const uploadsFolder = path.join(__dirname, "../../server/static/uploads");
      const cb = jest.fn();
      storageConfig.destination(null, null, cb);
      const calledFolder = cb.mock.calls[0][1];
      expect(calledFolder).toBe(uploadsFolder);
    });

    it("should generate a unique filename with correct extension", () => {
      const file = { fieldname: "photo", originalname: "test.jpg" };
      const cb = jest.fn();

      storageConfig.filename(null, file, cb);
      const generatedName = cb.mock.calls[0][1];
      expect(typeof generatedName).toBe("string");
      expect(generatedName).toMatch(/^photo-\d+-\d+\.jpg$/);
    });
  });

  describe("profile storage configuration (updateProfile)", () => {
    let profileStorageConfig;
    beforeEach(() => {
      profileStorageConfig = initialProfileStorageConfig || mockMulter.diskStorageConfig;
    });

    it("should set correct profile destination folder", () => {
      const folder = path.join(__dirname, "../../server/static/avatars");
      const cb = jest.fn();
      profileStorageConfig.destination(null, null, cb);
      expect(cb).toHaveBeenCalledWith(null, folder);
    });

    it("should generate a unique profile filename with extension", () => {
      const file = { fieldname: "personal_photo_path", originalname: "avatar.png" };
      const cb = jest.fn();
      profileStorageConfig.filename(null, file, cb);
      const generatedName = cb.mock.calls[0][1];
      expect(typeof generatedName).toBe("string");
      expect(generatedName).toMatch(/^personal_photo_path-\d+-\d+\.png$/);
    });

    it("should export updateProfile middleware that calls next()", () => {
      const modulePath = require.resolve("../../server/middlewares/uploadMiddleware");
      let exported;
      jest.isolateModules(() => {
        exported = require(modulePath);
      });
      const update = exported.updateProfile;
      expect(typeof update).toBe("function");
      const next = jest.fn();
      // our mocked single() returns a function calling next()
      update({}, {}, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("default upload middleware export", () => {
    it("should export upload array middleware that calls next()", () => {
      const modulePath = require.resolve("../../server/middlewares/uploadMiddleware");
      let exported;
      jest.isolateModules(() => {
        exported = require(modulePath);
      });
      expect(typeof exported).toBe("function");
      const next = jest.fn();
      // our mocked array() returns a function calling next()
      exported({}, {}, next);
      expect(next).toHaveBeenCalled();
    });

    it("should configure array field 'photos' with max 3 files", () => {
      // Access the first created multer instance (upload) and its array() calls
      expect(firstUploadInstance).toBeDefined();
      const args = mockMulter.lastArrayArgs;
      expect(args).toEqual(["photos", 3]);
    });
  });
});
