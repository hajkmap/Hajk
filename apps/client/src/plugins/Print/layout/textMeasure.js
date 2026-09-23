/**
 * Text measurement and positioning helpers shared by the layout builder.
 *
 * All measurement is done using a canvas 2D context with the Roboto font.
 * Functions are pure; any state they need is passed in explicitly.
 */

const FONT_STACK = "Roboto, roboto, sans-serif";

const getFont = (fontSize, fontWeight) =>
  `${fontWeight === "bold" ? "700" : "400"} ${fontSize}px ${FONT_STACK}`;

/**
 * Gets the height in points (PDF) or pixels (PNG) of the supplied text(s).
 *
 * @param {string|string[]} text A string, or an array of strings when
 * generating a PDF. Explicit newlines within each string count as extra lines.
 * @param {number} fontSize
 * @param {string} saveAsType "PDF" or anything else (pixels vs points).
 * @returns {number} Height in points (PDF) or pixels (other).
 */
export const getTextHeight = (text, fontSize, saveAsType) => {
  // If we are generating a PDF, an array of text is passed. Otherwise just a string.
  let numberOfLines = 1;
  if (typeof text === "object") {
    // Let's see if our texts (disclaimer, copyright) contain newlines, and if
    // so, ensure that they count towards the total height.
    let lineBreaks = 0;
    for (let i = 0; i < text.length; i++) {
      // Count how many newlines exist in the specific text part. Bear in mind that \n
      // is not the only possible newline, let's also count \r. \r\n is also a possibility,
      // but since it contains both \r and \n, we will count it as two newlines, which is correct.
      const newlineCount = (text[i].match(/\n|\r/g) || []).length;

      lineBreaks = lineBreaks + newlineCount;
    }
    numberOfLines = text.length + lineBreaks;
  }
  // Estimate lineheight and calculate the height in points over number of lines.
  const lineHeight = fontSize * 1.2;
  const totalHeight = lineHeight * numberOfLines;
  // Calculate points if we are creating a pdf
  const totalHeightInPoints = totalHeight * (72 / 96);
  // Return pixels if PNG or points if PDF
  return saveAsType === "PDF" ? totalHeightInPoints : totalHeight;
};

/**
 * Measures the width of a single-line text.
 */
export const getTextWidth = (text, size) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${size}px roboto`;
  return context.measureText(text).width;
};

/**
 * Word-wraps text to maxWidth. Honours explicit newlines.
 */
export const wrapTextToLines = (
  text,
  fontSize,
  maxWidth,
  fontWeight = "normal"
) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = getFont(fontSize, fontWeight);

  const measure = (str) => ctx.measureText(str).width;

  const lines = [];
  for (const segment of text.split("\n")) {
    if (measure(segment) <= maxWidth) {
      lines.push(segment);
      continue;
    }
    const words = segment.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
};

/**
 * Centred x for text within paperWidth.
 */
export const getCenteredX = (
  text,
  fontSize,
  paperWidth,
  fontWeight = "normal"
) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = getFont(fontSize, fontWeight);
  const textWidth = ctx.measureText(text).width;
  return (paperWidth - textWidth) / 2;
};

/**
 * Returns the x/y position for text that should be right aligned on the page.
 *
 * Depending on what other content occupies the bottom-right corner (QR code,
 * north arrow, scale bar, logo), the text is moved to the left of it.
 *
 * @param {Object} deps Instance state from the print model.
 * @param {Object} options Current print options.
 * @returns {Object} { x, y }
 */
export const getRightAlignedPositions = (
  {
    text,
    fontSize,
    xmargin,
    ymargin,
    paperWidth,
    fontWeight = "normal",
    maxWidth,
    saveAsType,
    northArrowMaxWidth,
    logoMaxWidth,
    mmPerPoint,
    scalebarMaxWidth,
  },
  options
) => {
  // If we are printing a PNG we assign the maxWidth to the width of the separate text string.
  if (saveAsType !== "PDF") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = `${fontWeight === "bold" ? "700" : "400"} ${fontSize}px Roboto, roboto, sans-serif`;
    maxWidth = context.measureText(text).width;
  }
  // If QrCode is placed in the bottom right corner, move text to the left of it (its wider)
  // Otherwise its a logo or northarrow, needs less text movement.
  // Also take care of scalebar placement bottomRight
  let x;
  if (options.includeQrCode && options.qrCodePlacement === "bottomRight") {
    x = paperWidth - maxWidth - xmargin - 90;
  } else if (
    options.includeNorthArrow &&
    options.northArrowPlacement === "bottomRight"
  ) {
    x = paperWidth - maxWidth - xmargin - northArrowMaxWidth * 3 - 10;
  } else if (
    options.includeScaleBar &&
    options.scaleBarPlacement === "bottomRight"
  ) {
    // Use the scalebarMaxWidth that either is the text or the scalebar length, to align ex copyright
    // and disclaimer/date correctly to the left of the scalebar when bottomRight
    x = paperWidth - maxWidth - xmargin - scalebarMaxWidth - 10;
  } else if (options.includeLogo && options.logoPlacement === "bottomRight") {
    x = paperWidth - maxWidth - xmargin - logoMaxWidth * mmPerPoint - 10;
  } else {
    x = paperWidth - maxWidth - xmargin;
  }
  const y = getTextHeight(text, fontSize, saveAsType) + ymargin;
  return { x, y };
};
