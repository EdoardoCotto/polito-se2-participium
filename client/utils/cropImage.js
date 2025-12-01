/**
 * Creates a cropped image from the original image using the specified crop area
 * @param {string} imageSrc - The source image URL
 * @param {Object} pixelCrop - The crop area in pixels {x, y, width, height}
 * @returns {Promise<Blob>} - The cropped image as a Blob
 */
export const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to match the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped portion of the image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.95 // Quality (0-1)
    );
  });
};

/**
 * Creates an Image object from a source URL
 * @param {string} src - The image source URL
 * @returns {Promise<HTMLImageElement>} - The loaded image
 */
const createImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = src;
  });

