/**
 * PDF renderer using @libpdf/core.
 * Consumes layout elements from PrintLayout and draws them onto a PDF page.
 *
 * Coordinates are used as-is (PDF convention: bottom-left origin, Y up).
 */
import { PDF, rgb } from "@libpdf/core";
import { ROBOTO_NORMAL, ROBOTO_BOLD } from "./constants";

/**
 * Convert an abstract color { r, g, b } (0–1 normalized) to libpdf's rgb().
 */
function toRgb(color) {
  return rgb(color.r, color.g, color.b);
}

/**
 * Decode a base64 font string to Uint8Array.
 */
function loadFont(font) {
  const binaryString = atob(font);
  const length = binaryString.length;
  const uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}

/**
 * Fetch a data URL (or regular URL) and return as Uint8Array.
 */
async function fetchImageAsBytes(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Render layout elements to a PDF document.
 * @param {Array} elements - layout elements from buildLayout()
 * @param {number} pageWidth - page width in PDF points
 * @param {number} pageHeight - page height in PDF points
 * @param {string} orientation - "landscape" or "portrait"
 * @returns {Promise<Object>} the PDF document (caller saves via pdf.save())
 */
export async function renderToPdf(
  elements,
  pageWidth,
  pageHeight,
  orientation
) {
  const pdf = PDF.create();
  const page = pdf.addPage({
    orientation,
    width: pageWidth,
    height: pageHeight,
  });

  // Embed fonts
  const fontNormalBytes = loadFont(ROBOTO_NORMAL);
  const fontBoldBytes = loadFont(ROBOTO_BOLD);
  const fonts = {
    normal: pdf.embedFont(fontNormalBytes),
    bold: pdf.embedFont(fontBoldBytes),
  };

  for (const el of elements) {
    switch (el.type) {
      case "image": {
        const buffer = await fetchImageAsBytes(el.src);
        const image = pdf.embedImage(buffer);
        page.drawImage(image, {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
        });
        break;
      }

      case "text": {
        page.drawText(el.text, {
          x: el.x,
          y: el.y,
          size: el.size,
          font: fonts[el.fontStyle] || fonts.normal,
          color: toRgb(el.color),
        });
        break;
      }

      case "line": {
        page.drawLine({
          start: { x: el.startX, y: el.startY },
          end: { x: el.endX, y: el.endY },
          color: toRgb(el.color),
          thickness: el.thickness,
        });
        break;
      }

      case "strokePath": {
        const path = page.drawPath();
        path.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          path.lineTo(el.points[i].x, el.points[i].y);
        }
        if (el.closePath) {
          path.close();
        }
        path.stroke({
          borderColor: toRgb(el.color),
          borderWidth: el.lineWidth,
        });
        break;
      }

      default:
        console.warn(`PdfRenderer: unknown element type "${el.type}"`);
    }
  }

  return pdf;
}
