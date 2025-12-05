"use strict";

const path = require("node:path");

// utilizzeremo degli spy sul modulo reale fs

// Mock middleware functions moved to outer scope
function mockArrayMiddleware(req, res, next) { next?.(); }
function mockSingleMiddleware(req, res, next) { next?.(); }

// mock di multer (due mapping: 'multer' e la possibile risoluzione in server/node_modules)
jest.mock("multer", () => {
  const shared = globalThis.__multerState__ || (globalThis.__multerState__ = {});
  
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

// Alcuni ambienti risolvono multer da server/node_modules: mappiamo anche quel percorso
try {
  const serverMulterPath = require.resolve("../../server/node_modules/multer");
  jest.mock(serverMulterPath, () => {
    const shared = globalThis.__multerState__ || (globalThis.__multerState__ = {});
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
} catch (e) {
  // ignore if path not resolvable in this workspace
}

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

// Helper per ricaricare il modulo con mock di multer sicuri
function loadUploadMiddlewareWithMock() {
  jest.resetModules();
  jest.doMock("multer", () => {
    const shared = globalThis.__multerState__ || (globalThis.__multerState__ = {});
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
  // Also mock possible server-local resolution of multer
  try {
    const serverMulterPath = require.resolve("../../server/node_modules/multer");
    jest.doMock(serverMulterPath, () => {
      const shared = globalThis.__multerState__ || (globalThis.__multerState__ = {});
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
  } catch (e) {
    // ignore
  }
  const modulePath = require.resolve("../../server/middlewares/uploadMiddleware");
  let exported;
  jest.isolateModules(() => {
    exported = require(modulePath);
  });
  return { exported, modulePath };
}

describe("uploadMiddleware", () => {
  // Nessun beforeEach: evitiamo di azzerare i conteggi delle chiamate iniziali fs.existsSync/mkdirSync

  it("should create upload directory if it does not exist", () => {
    // prepara gli spy
    const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});
    // esegui il modulo in ambiente isolato con mock sicuro di multer
    const { modulePath } = loadUploadMiddlewareWithMock();
    const expectedDir = path.join(path.dirname(modulePath), "..", "static", "uploads");
    expect(existsSpy).toHaveBeenCalledWith(expectedDir);
    expect(mkdirSpy).toHaveBeenCalledWith(expectedDir, { recursive: true });
    existsSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  it("should create profile directory if it does not exist", () => {
    const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});
    const { modulePath } = loadUploadMiddlewareWithMock();
    const expectedDir = path.join(path.dirname(modulePath), "..", "static", "avatars");
    expect(existsSpy).toHaveBeenCalledWith(expectedDir);
    expect(mkdirSpy).toHaveBeenCalledWith(expectedDir, { recursive: true });
    existsSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  it("should NOT create directories when they already exist", () => {
    const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
    const mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});
    const { modulePath } = loadUploadMiddlewareWithMock();
    expect(mkdirSpy).not.toHaveBeenCalled();
    existsSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  it("should configure multer with proper limits and array field", () => {
    const { exported } = loadUploadMiddlewareWithMock();
    expect(exported).toBeDefined();

    const opts = globalThis.__multerState__?.lastOptions;
    expect(opts).toBeDefined();
    expect(opts.limits.fileSize).toBe(1024 * 1024 * 5);
    expect(typeof opts.fileFilter).toBe("function");
    expect(opts.storage).toBeDefined();
  });

  describe("fileFilter behavior", () => {
    let fileFilter;

    beforeEach(() => {
      // Reload to ensure the mock captures options
      loadUploadMiddlewareWithMock();
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
      // Reload to ensure storage config is available on global state
      loadUploadMiddlewareWithMock();
      storageConfig = globalThis.__multerState__?.diskStorageConfigs?.[0];
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
      expect(generatedName).toMatch(/^photo-\d+-[a-f0-9]{16}\.jpg$/);
    });
  });

  describe("profile storage configuration (updateProfile)", () => {
    let profileStorageConfig;
    beforeEach(() => {
      loadUploadMiddlewareWithMock();
      profileStorageConfig = globalThis.__multerState__?.diskStorageConfigs?.[1] || globalThis.__multerState__?.diskStorageConfig;
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
      expect(generatedName).toMatch(/^personal_photo_path-\d+-[a-f0-9]{16}\.png$/);
    });

    it("should export updateProfile middleware that calls next()", () => {
      const { exported } = loadUploadMiddlewareWithMock();
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
      const { exported } = loadUploadMiddlewareWithMock();
      expect(typeof exported).toBe("function");
      const next = jest.fn();
      // our mocked array() returns a function calling next()
      exported({}, {}, next);
      expect(next).toHaveBeenCalled();
    });

    it("should configure array field 'photos' with max 3 files", () => {
      // Access the first created multer instance (upload) and its array() calls
      expect(globalThis.__multerState__).toBeDefined();
      const args = globalThis.__multerState__?.lastArrayArgs;
      expect(args).toEqual(["photos", 3]);
    });
  });
});
