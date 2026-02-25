/**
 * PNG renderer using Canvas 2D API.
 * Consumes layout elements from PrintLayout and draws them onto a canvas,
 * handling Y-flip (PDF bottom-left origin → canvas top-left origin)
 * and point-to-pixel scaling.
 */
import { saveAs } from "file-saver";

/**
 * Convert an abstract color { r, g, b } (0–1 normalized) to CSS rgb() string.
 */
function toCssColor(color) {
  return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

/**
 * Load an image from a data URL or blob URL and return an Image element.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Render layout elements to a PNG blob.
 * @param {Array} elements - layout elements from buildLayout()
 * @param {number} pageWidth - page width in PDF points
 * @param {number} pageHeight - page height in PDF points
 * @param {number} pixelWidth - output canvas width in pixels
 * @param {number} pixelHeight - output canvas height in pixels
 * @param {string} fileName - file name for download (without extension)
 * @param {string} type - "PNG" for file download, "BLOB" for returning blob only
 * @param {string} textFontSize - font size chosen
 * @returns {Promise<Blob>}
 */
export async function renderToPng(
  elements,
  pageWidth,
  pageHeight,
  pixelWidth,
  pixelHeight,
  fileName,
  type
) {
  const canvas = document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext("2d");

  // Scale factor: PDF points → pixels
  const s = pixelWidth / pageWidth;

  // Y-flip helper (PDF: Y=0 at bottom; Canvas: Y=0 at top)
  const flipY = (y) => pixelHeight - y * s;

  for (const el of elements) {
    switch (el.type) {
      case "image": {
        const img = await loadImage(el.src);
        // In PDF coords: image bottom-left is at (el.x, el.y)
        // In canvas: we need the top-left corner
        const cx = el.x * s;
        const cy = flipY(el.y + el.height);
        const cw = el.width * s;
        const ch = el.height * s;
        ctx.drawImage(img, cx, cy, cw, ch);
        break;
      }

      case "text": {
        ctx.save();
        ctx.font = `${el.fontStyle === "bold" ? "700" : "400"} ${el.size * s}px Roboto, roboto, sans-serif`;
        ctx.fillStyle = toCssColor(el.color);
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
        // PDF y is the baseline position from bottom
        const tx = el.x * s;
        const ty = flipY(el.y);
        ctx.fillText(el.text, tx, ty);
        ctx.restore();
        break;
      }

      case "line": {
        ctx.save();
        ctx.strokeStyle = toCssColor(el.color);
        ctx.lineWidth = el.thickness * s;
        ctx.beginPath();
        ctx.moveTo(el.startX * s, flipY(el.startY));
        ctx.lineTo(el.endX * s, flipY(el.endY));
        ctx.stroke();
        ctx.restore();
        break;
      }

      case "strokePath": {
        ctx.save();
        ctx.strokeStyle = toCssColor(el.color);
        ctx.lineWidth = el.lineWidth * s;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x * s, flipY(el.points[0].y));
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x * s, flipY(el.points[i].y));
        }
        if (el.closePath) {
          ctx.closePath();
        }
        ctx.stroke();
        ctx.restore();
        break;
      }

      default:
        console.warn(`PngRenderer: unknown element type "${el.type}"`);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (type !== "BLOB") {
        saveAs(blob, `${fileName}.png`);
      }
      resolve(blob);
    });
  });
}
