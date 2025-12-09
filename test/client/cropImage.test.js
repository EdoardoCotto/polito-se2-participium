/**
 * @jest-environment jsdom
 */

import { getCroppedImg } from '../../client/utils/cropImage';

describe('cropImage utilities', () => {
  let mockCanvas;
  let mockContext;
  let mockImage;

  beforeEach(() => {
    mockContext = {
      drawImage: jest.fn(),
    };

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockContext),
      toBlob: jest.fn((callback) => {
        const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });
        callback(mockBlob);
      }),
    };

    document.createElement = jest.fn((tag) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return document.createElement.bind(document)(tag);
    });

    mockImage = {
      addEventListener: jest.fn((event, handler) => {
        if (event === 'load') {
          setTimeout(() => handler(), 0);
        }
      }),
      removeEventListener: jest.fn(),
      src: '',
    };

    global.Image = jest.fn(() => mockImage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCroppedImg', () => {
    it('should create a cropped image with correct dimensions', async () => {
      const imageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const pixelCrop = { x: 10, y: 20, width: 100, height: 200 };

      const blob = await getCroppedImg(imageSrc, pixelCrop);

      expect(mockCanvas.width).toBe(100);
      expect(mockCanvas.height).toBe(200);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });

    it('should call drawImage with correct parameters', async () => {
      const imageSrc = 'data:image/png;base64,test';
      const pixelCrop = { x: 5, y: 10, width: 50, height: 75 };

      await getCroppedImg(imageSrc, pixelCrop);

      expect(mockContext.drawImage).toHaveBeenCalledWith(
        expect.any(Object),
        5, 10, 50, 75,
        0, 0, 50, 75
      );
    });

    it('should throw error if canvas context is not available', async () => {
      mockCanvas.getContext = jest.fn(() => null);

      const imageSrc = 'data:image/png;base64,test';
      const pixelCrop = { x: 0, y: 0, width: 100, height: 100 };

      await expect(getCroppedImg(imageSrc, pixelCrop)).rejects.toThrow('No 2d context');
    });

    it('should reject if canvas.toBlob returns null', async () => {
      mockCanvas.toBlob = jest.fn((callback) => {
        callback(null);
      });

      const imageSrc = 'data:image/png;base64,test';
      const pixelCrop = { x: 0, y: 0, width: 100, height: 100 };

      await expect(getCroppedImg(imageSrc, pixelCrop)).rejects.toThrow('Canvas is empty');
    });

    it('should handle different crop dimensions', async () => {
      const imageSrc = 'data:image/png;base64,test';
      const testCases = [
        { x: 0, y: 0, width: 200, height: 150 },
        { x: 50, y: 50, width: 300, height: 300 },
        { x: 100, y: 200, width: 150, height: 250 },
      ];

      for (const pixelCrop of testCases) {
        mockCanvas.width = 0;
        mockCanvas.height = 0;
        mockContext.drawImage.mockClear();

        await getCroppedImg(imageSrc, pixelCrop);

        expect(mockCanvas.width).toBe(pixelCrop.width);
        expect(mockCanvas.height).toBe(pixelCrop.height);
        expect(mockContext.drawImage).toHaveBeenCalledWith(
          expect.any(Object),
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
      }
    });

    it('should use correct image quality for JPEG', async () => {
      const imageSrc = 'data:image/png;base64,test';
      const pixelCrop = { x: 0, y: 0, width: 100, height: 100 };

      await getCroppedImg(imageSrc, pixelCrop);

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.95
      );
    });

    it('should handle image loading error', async () => {
      global.Image = jest.fn(() => ({
        addEventListener: jest.fn((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler({ message: 'Failed to load' }), 0);
          }
        }),
        src: '',
      }));

      const imageSrc = 'invalid-image-src';
      const pixelCrop = { x: 0, y: 0, width: 100, height: 100 };

      await expect(getCroppedImg(imageSrc, pixelCrop)).rejects.toThrow('Failed to load image');
    });

    it('should set image src correctly', async () => {
      const imageSrc = 'data:image/png;base64,testdata';
      const pixelCrop = { x: 0, y: 0, width: 100, height: 100 };

      await getCroppedImg(imageSrc, pixelCrop);

      expect(mockImage.src).toBe(imageSrc);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-dimension crops', async () => {
      const imageSrc = 'data:image/png;base64,test';
      const pixelCrop = { x: 0, y: 0, width: 0, height: 0 };

      const blob = await getCroppedImg(imageSrc, pixelCrop);

      expect(mockCanvas.width).toBe(0);
      expect(mockCanvas.height).toBe(0);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should handle large crop dimensions', async () => {
      const imageSrc = 'data:image/png;base64,test';
      const pixelCrop = { x: 0, y: 0, width: 5000, height: 5000 };

      await getCroppedImg(imageSrc, pixelCrop);

      expect(mockCanvas.width).toBe(5000);
      expect(mockCanvas.height).toBe(5000);
    });

    it('should handle negative coordinates (canvas will handle clipping)', async () => {
      const imageSrc = 'data:image/png;base64,test';
      const pixelCrop = { x: -10, y: -20, width: 100, height: 100 };

      await getCroppedImg(imageSrc, pixelCrop);

      expect(mockContext.drawImage).toHaveBeenCalledWith(
        expect.any(Object),
        -10,
        -20,
        100,
        100,
        0,
        0,
        100,
        100
      );
    });
  });
});
