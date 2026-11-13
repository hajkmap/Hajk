import QRCode from "qrcode";

/**
 * Image-related helpers for the print plugin.
 */

/**
 * Returns a Promise which resolves if image loading succeeded.
 * The Promise will contain an object with data blob of the loaded image.
 * If loading fails, the Promise rejects.
 *
 * @param {*} url
 * @returns {Promise}
 */
export const getImageDataBlobFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.setAttribute("crossOrigin", "anonymous"); //getting images from external domain

    // We must resolve the promise even if
    image.onerror = function (err) {
      reject(err);
    };

    // When load succeeds
    image.onload = function () {
      const imgCanvas = document.createElement("canvas");
      imgCanvas.width = this.naturalWidth;
      imgCanvas.height = this.naturalHeight;

      // Draw the image on canvas so that we can read the data blob later on
      imgCanvas.getContext("2d").drawImage(this, 0, 0);

      resolve({
        data: imgCanvas.toDataURL("image/png"), // read data blob from canvas
        width: imgCanvas.width, // also return dimensions so we can use them later
        height: imgCanvas.height,
      });
    };

    // Go, load!
    image.src = url;
  });
};

/**
 * Helper function that takes a URL and max width and returns the ready data
 * blob as well as width/height which fit into the specified max value.
 *
 * @param {*} url
 * @param {*} maxWidth
 * @returns {Promise<Object>} image data blob, image width, image height
 */
export const getImageForPdfFromUrl = async (url, maxWidth) => {
  // Use the supplied URL to get img data blob and dimensions
  const {
    data,
    width: sourceWidth,
    height: sourceHeight,
  } = await getImageDataBlobFromUrl(url);

  // We must ensure that the image will be printed with a max width of X,
  // while keeping the aspect ratio between width and height
  const ratio = (maxWidth * 3) / sourceWidth;
  const width = sourceWidth * ratio;
  const height = sourceHeight * ratio;
  return { data, width, height };
};

/**
 * Generates a QR code (as a data URL) for the supplied URL.
 *
 * @param {string} url
 * @param {number} qrSize Desired size; the resulting size is 4x this value.
 * @returns {Promise<Object|string>} Object with data/width/height, or "" on failure.
 */
export const generateQR = async (url, qrSize) => {
  try {
    return {
      data: await QRCode.toDataURL(url),
      width: qrSize * 4,
      height: qrSize * 4,
    };
  } catch (err) {
    console.warn(err);
    return "";
  }
};
