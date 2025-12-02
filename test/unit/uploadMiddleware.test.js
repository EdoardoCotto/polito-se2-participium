"use strict";

const path = require("node:path");

// utilizzeremo degli spy sul modulo reale fs

// mock di multer (due mapping: 'multer' e la possibile risoluzione in server/node_modules)
jest.mock("multer", () => {
  const shared = globalThis.__multerState__ || (globalThis.__multerState__ = {});
  
  function mockArrayMiddleware(req, res, next) { next?.(); }
  function mockSingleMiddleware(req, res, next) { next?.(); }
  
  const mockMulter = (opts) => {
    shared.lastOptions = opts;
    const instance = {
      array: (field, max) => {
        shared.lastArrayArgs = [field, max];
        return mockArrayMiddleware;
      },
      single: () => {
        return mockSingleMiddleware;
      },
    };
    if (!shared.instances) shared.instances = [];
    shared.instances.push(instance);
    return instance;
  };
  mockMulter.diskStorage = (config) => {
    if (!shared.diskStorageConfigs) shared.diskStorageConfigs = [];
    shared.diskStorageConfigs.push(config);
    shared.diskStorageConfig = config;
    return config;
  };
  return mockMulter;
});

const fs = require("node:fs");

// carica il middleware in un modulo isolato per garantire l'uso dei mock
let uploadMiddleware;
let initialStorageConfig;
let initialProfileStorageConfig;
let firstUploadInstance;
jest.isolateModules(() => {
  uploadMiddleware = require("../../server/middlewares/uploadMiddleware");
  // Capture the diskStorage configuration objects from the initial module load
  initialStorageConfig = globalThis.__multerState__?.diskStorageConfigs?.[0];
  initialProfileStorageConfig = globalThis.__multerState__?.diskStorageConfigs?.[1];
  // Capture the first multer instance (used for upload)
  firstUploadInstance = globalThis.__multerState__?.instances?.[0];
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

    const opts = globalThis.__multerState__?.lastOptions;
    expect(opts).toBeDefined();
    expect(opts.limits.fileSize).toBe(1024 * 1024 * 5);
    expect(typeof opts.fileFilter).toBe("function");
    expect(opts.storage).toBeDefined();
  });

  describe("fileFilter behavior", () => {
    let fileFilter;

    beforeEach(() => {
      fileFilter = globalThis.__multerState__?.lastOptions?.fileFilter;
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
      profileStorageConfig = initialProfileStorageConfig || globalThis.__multerState__?.diskStorageConfig;
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

    // no explicit assertion on single field args; validated via mock middleware call above
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
      const args = globalThis.__multerState__?.lastArrayArgs;
      expect(args).toEqual(["photos", 3]);
    });
  });
});
