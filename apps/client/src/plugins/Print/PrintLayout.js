/**
 * Shared layout computation for print output.
 * Produces an array of renderer-agnostic layout elements that can be
 * consumed by either PdfRenderer or PngRenderer.
 *
 * Coordinate convention: PDF points with origin at bottom-left, Y increasing upward.
 *
 * Layout element types:
 *   { type: "image", src, x, y, width, height }
 *   { type: "text", text, x, y, size, fontStyle, color }
 *   { type: "line", startX, startY, endX, endY, color, thickness }
 *   { type: "strokePath", points, color, lineWidth, closePath }
 *
 * Colors are plain { r, g, b } objects in the 0–1 normalized range.
 */

/**
 * Build the complete layout for a print page.
 * @param {import("./PrintModel").default} model - PrintModel instance (provides helpers and configuration)
 * @param {string} mapDataUrl - data URL of the rendered map canvas
 * @param {Object} options - print options
 * @param {number} pageWidth - page width in PDF points
 * @param {number} pageHeight - page height in PDF points
 * @param {number} scaleResolution - computed scale resolution
 * @param {string} windowUrl - current window URL (for QR code)
 * @returns {Promise<Array>} array of layout elements
 */
export async function buildLayout(
  model,
  mapDataUrl,
  options,
  pageWidth,
  pageHeight,
  scaleResolution,
  windowUrl
) {
  const elements = [];

  // 1. Map image (full page background)
  elements.push({
    type: "image",
    src: mapDataUrl,
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  // 2. Margins
  if (model.margin > 0) {
    if (!options.useTextIconsInMargin) {
      // Single uniform margin around all edges
      elements.push({
        type: "strokePath",
        points: [
          { x: 0, y: 0 },
          { x: pageWidth, y: 0 },
          { x: pageWidth, y: pageHeight },
          { x: 0, y: pageHeight },
          { x: 0, y: 0 },
        ],
        color: { r: 1, g: 1, b: 1 },
        lineWidth: 5.5 * model.margin,
        closePath: true,
      });
    } else {
      // Separate edges: top & bottom wider for text/icons
      // Bottom edge
      elements.push({
        type: "strokePath",
        points: [
          { x: 0, y: 0 },
          { x: pageWidth, y: 0 },
        ],
        color: { r: 1, g: 1, b: 1 },
        lineWidth: 16 * model.margin,
        closePath: false,
      });
      // Right edge
      elements.push({
        type: "strokePath",
        points: [
          { x: pageWidth, y: 0 },
          { x: pageWidth, y: pageHeight },
        ],
        color: { r: 1, g: 1, b: 1 },
        lineWidth: 5.5 * model.margin,
        closePath: false,
      });
      // Top edge
      elements.push({
        type: "strokePath",
        points: [
          { x: pageWidth, y: pageHeight },
          { x: 0, y: pageHeight },
        ],
        color: { r: 1, g: 1, b: 1 },
        lineWidth: 16 * model.margin,
        closePath: false,
      });
      // Left edge
      elements.push({
        type: "strokePath",
        points: [
          { x: 0, y: pageHeight },
          { x: 0, y: 0 },
        ],
        color: { r: 1, g: 1, b: 1 },
        lineWidth: 5.5 * model.margin,
        closePath: false,
      });
    }
  }

  // 3. QR Code
  if (options.includeQrCode && model.mapConfig.enableAppStateInHash) {
    try {
      const qrCode = await model.generateQR(windowUrl, 20);
      const qrCodePlacement = model.getPlacement(
        options.qrCodePlacement,
        qrCode.width,
        qrCode.height,
        pageWidth,
        pageHeight,
        "qrCode"
      );
      elements.push({
        type: "image",
        src: qrCode.data,
        x: qrCodePlacement.x,
        y: qrCodePlacement.y,
        width: qrCode.width,
        height: qrCode.height,
      });
    } catch (error) {
      model.localObserver.publish("error-loading-image", {
        error,
        type: "QR-koden",
      });
    }
  }

  // 4. Logo
  if (options.includeLogo && model.logoUrl.trim().length >= 5) {
    try {
      const {
        data: logoData,
        width: logoWidth,
        height: logoHeight,
      } = await model.getImageForPdfFromUrl(model.logoUrl, model.logoMaxWidth);
      const logoPlacement = model.getPlacement(
        options.logoPlacement,
        logoWidth,
        logoHeight,
        pageWidth,
        pageHeight
      );
      elements.push({
        type: "image",
        src: logoData,
        x: logoPlacement.x - 5,
        y: logoPlacement.y - 5,
        width: logoWidth,
        height: logoHeight,
      });
    } catch (error) {
      model.localObserver.publish("error-loading-image", {
        error,
        type: "Logotypbilden",
      });
    }
  }

  // 5. North Arrow
  if (options.includeNorthArrow && model.northArrowUrl.trim().length >= 5) {
    try {
      const {
        data: arrowData,
        width: arrowWidth,
        height: arrowHeight,
      } = await model.getImageForPdfFromUrl(
        model.northArrowUrl,
        model.northArrowMaxWidth
      );
      const arrowPlacement = model.getPlacement(
        options.northArrowPlacement,
        arrowWidth,
        arrowHeight,
        pageWidth,
        pageHeight
      );
      elements.push({
        type: "image",
        src: arrowData,
        x: arrowPlacement.x,
        y: arrowPlacement.y,
        width: arrowWidth,
        height: arrowHeight,
      });
    } catch (error) {
      model.localObserver.publish("error-loading-image", {
        error,
        type: "Norrpilen",
      });
    }
  }

  // 6. Scale bar
  if (options.includeScaleBar) {
    buildScaleBarElements(
      model,
      elements,
      { r: 0, g: 0, b: 0 },
      options.scale,
      options.scaleBarPlacement,
      options.format,
      options.orientation,
      pageWidth,
      pageHeight
    );
  }

  // 7. Map title
  if (options.mapTitle.trim().length > 0) {
    const verticalMargin = options.useTextIconsInMargin
      ? model.margin + 35
      : 50;
    const position = model.getCenterAlignedPositions(
      options.mapTitle,
      28,
      verticalMargin,
      pageWidth,
      pageHeight
    );
    elements.push({
      type: "text",
      text: options.mapTitle,
      x: position.x,
      y: position.y,
      size: 28,
      fontStyle: "normal",
      color: model.textColor,
    });
  }

  // 8. Print comment
  if (options.printComment.trim().length > 0) {
    const verticalMargin = options.useTextIconsInMargin
      ? model.margin + 50
      : 60;
    const position = model.getCenterAlignedPositions(
      options.printComment,
      11,
      verticalMargin,
      pageWidth,
      pageHeight
    );
    elements.push({
      type: "text",
      text: options.printComment,
      x: position.x,
      y: position.y - 5,
      size: 11,
      fontStyle: "normal",
      color: model.textColor,
    });
  }

  // 9. Date text
  if (model.date.length > 0) {
    const dateText = model.date.replace(
      "{date}",
      new Date().toLocaleDateString()
    );
    const position = model.getRightAlignedPositions(
      model.date,
      model.textFontSize,
      30,
      8,
      pageWidth,
      options
    );
    elements.push({
      type: "text",
      text: dateText,
      x: position.x,
      y: position.y,
      size: model.textFontSize,
      fontStyle: model.textFontWeight,
      color: model.textColor,
    });
  }

  // 10. Copyright text
  if (model.copyright.length > 0) {
    const position = model.getRightAlignedPositions(
      model.copyright,
      model.textFontSize,
      8,
      18,
      pageWidth,
      options
    );
    elements.push({
      type: "text",
      text: model.copyright,
      x: position.x,
      y: position.y,
      size: model.textFontSize,
      fontStyle: model.textFontWeight,
      color: model.textColor,
    });
  }

  // 11. Disclaimer text
  if (model.disclaimer.length > 0) {
    const position = model.getRightAlignedPositions(
      model.disclaimer,
      model.textFontSize,
      8,
      28,
      pageWidth,
      options
    );
    elements.push({
      type: "text",
      text: model.disclaimer,
      x: position.x,
      y: position.y,
      size: model.textFontSize,
      fontStyle: model.textFontWeight,
      color: model.textColor,
    });
  }

  return elements;
}

// SCALE BAR HELPERS
// All helpers below work by pushing layout elements into the shared `elements`
// array that's passed in from `buildLayout`. They don't return anything — instead
// they mutate the array directly.
// You may wonder why we don't use a more functional approach here?
// Well, the scale bar is made up of lots of small pieces (lines, texts, ticks). Having each
// helper return its own array, that we'd eventually have to merge, felt unnecessarily complex.
// So we just mutate the array directly. The code is synchronous anyway.

/**
 * Builds all the layout elements needed for the scale bar.
 * This one is invoked from the main buildLayout function.
 *
 * We need to do some math here:
 * - First we figure out how many meters the bar should represent (depending on the current scale).
 * - Then we convert that to PDF points (since the scale bar is a rectangle in the PDF).
 *
 * The scale bar consists of two text labels (the length text and the "Skala: 1:X..." text),
 * along with all the divider lines and optional divider numbers.
 *
 * We also have to set `model.scaleText` here since `getPlacement` relies on it when calculating
 * the position (specifically for the "bottomRight" case where the text width matters).
 *
 * @param {import("./PrintModel").default} model - PrintModel instance
 * @param {Array} elements - The array of layout elements
 * @param {Object} color - The color of the scale bar.
 * @param {number} scale - The current scale.
 * @param {string} scaleBarPlacement - The placement of the scale bar.
 * @param {string} format - The format of the page.
 * @param {string} orientation - The orientation of the page.
 * @param {number} pageWidth - The width of the page.
 * @param {number} pageHeight - The height of the page.
 * @returns {void}
 */
function buildScaleBarElements(
  model,
  elements,
  color,
  scale,
  scaleBarPlacement,
  format,
  orientation,
  pageWidth,
  pageHeight
) {
  const mPerInch = 0.0254; // 1 inch = 0.0254 meters
  const pointsPerInch = 72; // 1 inch = 72 points

  // We need the scale bar length in three units:
  // 1. Meters — that's the real-world distance the bar represents on the map.
  // 2. Inches — we get here by dividing meters by the map scale (to get the
  //    physical length on paper) and then by meters-per-inch (to switch units).
  // 3. PDF points — there are 72 points in an inch, and points are what our
  //    layout coordinate system uses. So we multiply inches by 72 to arrive
  //    at the final value we can actually position on the page.

  // 1. Get the length that the scalebar should represent
  const scaleBarLengthInMeters = model.getFittingScaleBarLength(scale);

  // 2. Convert those meters to inches for the scale
  const scaleBarLengthInInches = scaleBarLengthInMeters / scale / mPerInch;

  // 3. Convert inches to points
  const scaleBarLengthInPoints = scaleBarLengthInInches * pointsPerInch;

  // The height of the scale bar, could be configurable later but for now it's a constant.
  const scaleBarHeight = 6;

  model.scaleText = `Skala: ${model.getUserFriendlyScale(
    scale
  )} (vid ${format.toUpperCase()} ${
    orientation === "landscape" ? "liggande" : "stående"
  })`;

  // Determine the position of the scale bar on the page.
  const scaleBarPosition = model.getPlacement(
    scaleBarPlacement,
    scaleBarLengthInPoints,
    scaleBarHeight,
    pageWidth,
    pageHeight,
    "scaleBar"
  );

  // Length text (e.g. "500 m")
  const lengthText = model.getLengthText(scaleBarLengthInMeters);
  elements.push({
    type: "text",
    text: lengthText,
    x: scaleBarPosition.x + scaleBarLengthInPoints + 2,
    y: scaleBarPosition.y + 6,
    size: 8,
    fontStyle: "normal",
    color,
  });

  // Scale text (e.g. "Skala: 1:5 000 (vid A4 liggande)")
  elements.push({
    type: "text",
    text: model.scaleText,
    x: scaleBarPosition.x,
    y: scaleBarPosition.y + 20,
    size: 10,
    fontStyle: "normal",
    color,
  });

  // Now, let's invoke the helper that builds the divider lines.
  // Please note that it will mutate the `elements` array directly, just
  // as the rest of this function does.
  buildDividerLines(
    model,
    elements,
    scaleBarPosition,
    scaleBarLengthInPoints,
    color,
    scaleBarLengthInMeters
  );

  // Divider _texts_ (labels like "0", "500", etc.) are only added if the
  // current scale is one of the admin-configured scales. Why? Because the numbers are
  // derived from that configuration, and if the scale isn't in there, the labels wouldn't
  // line up with the tick marks — which would be more confusing than having no labels at all.
  if (model.scaleBarLengths[scale]) {
    buildDividerTexts(
      model,
      elements,
      scaleBarPosition,
      scaleBarLengthInPoints,
      scaleBarLengthInMeters,
      color
    );
  }
}

/**
 * Draws all the lines that make up the actual scale bar line. This includes the
 * main horizontal line and the vertical ticks.
 *
 * If the space between 0 and the first major division is large enough, we also add
 * finer subdivision lines (every 1/5 of the first interval) so the bar looks more precise.
 * Without this extra calculation, the bar would look like it was missing some lines. And
 * if we'd always add the lines, the bar would look way too crowded.
 *
 * @param {import("./PrintModel").default} model - PrintModel instance
 * @param {Array} elements - The array of layout elements.
 * @param {Object} scaleBarPosition - The position of the scale bar.
 * @param {number} scaleBarLength - The length of the scale bar.
 * @param {Object} color - The color of the scale bar.
 * @param {number} scaleBarLengthMeters - The length of the scale bar in meters.
 * @returns {void}
 */
function buildDividerLines(
  model,
  elements,
  scaleBarPosition,
  scaleBarLength,
  color,
  scaleBarLengthMeters
) {
  // Main horizontal line
  elements.push({
    type: "line",
    startX: scaleBarPosition.x,
    startY: scaleBarPosition.y + 9,
    endX: scaleBarPosition.x + scaleBarLength,
    endY: scaleBarPosition.y + 9,
    color,
    thickness: 1,
  });

  // Left vertical cap
  elements.push({
    type: "line",
    startX: scaleBarPosition.x,
    startY: scaleBarPosition.y + 3,
    endX: scaleBarPosition.x,
    endY: scaleBarPosition.y + 15,
    color,
    thickness: 1,
  });

  // Right vertical cap
  elements.push({
    type: "line",
    startX: scaleBarPosition.x + scaleBarLength,
    startY: scaleBarPosition.y + 3,
    endX: scaleBarPosition.x + scaleBarLength,
    endY: scaleBarPosition.y + 15,
    color,
    thickness: 1,
  });

  const { divLinesArray } = model.getDivLinesArrayAndDivider(
    scaleBarLengthMeters,
    scaleBarLength
  );

  // Dividing lines marking intervals along the scale bar
  divLinesArray.forEach((divLine) => {
    const largerMiddleLineValue =
      divLinesArray.length === 10 && divLine === divLinesArray[4] ? 2.1 : 0;
    elements.push({
      type: "line",
      startX: scaleBarPosition.x + divLine,
      startY: scaleBarPosition.y + 5.7 - largerMiddleLineValue,
      endX: scaleBarPosition.x + divLine,
      endY: scaleBarPosition.y + 12.3 + largerMiddleLineValue,
      color,
      thickness: 1,
    });
  });

  // Additional fine lines between 0 and first division
  if (divLinesArray[0] > 10) {
    const numLine = divLinesArray[0] / 5;
    for (
      let divLine = numLine;
      divLine < divLinesArray[0];
      divLine += numLine
    ) {
      elements.push({
        type: "line",
        startX: scaleBarPosition.x + divLine,
        startY: scaleBarPosition.y + 6.75,
        endX: scaleBarPosition.x + divLine,
        endY: scaleBarPosition.y + 11.55,
        color,
        thickness: 1,
      });
    }
  }
}

/**
 * Builds the text labels for the scale bar divider lines.
 * This one is invoked from the buildScaleBarElements function.
 *
 * @param {import("./PrintModel").default} model - PrintModel instance
 * @param {Array} elements - The array of layout elements.
 * @param {Object} scaleBarPosition - The position of the scale bar.
 * @param {number} scaleBarLength - The length of the scale bar.
 * @param {number} scaleBarLengthMeters - The length of the scale bar in meters.
 * @param {Object} color - The color of the scale bar.
 * @returns {void}
 */
function buildDividerTexts(
  model,
  elements,
  scaleBarPosition,
  scaleBarLength,
  scaleBarLengthMeters,
  color
) {
  // "0" at start
  elements.push({
    type: "text",
    text: "0",
    x: scaleBarPosition.x,
    y: scaleBarPosition.y - 3,
    size: 8,
    fontStyle: "normal",
    color,
  });

  const calculatedScaleBarLengthMeters =
    scaleBarLengthMeters > 1000
      ? (scaleBarLengthMeters / 1000).toString()
      : scaleBarLengthMeters;

  const { divLinesArray, divider } = model.getDivLinesArrayAndDivider(
    scaleBarLengthMeters,
    scaleBarLength
  );

  const scaleBarHasSpace = divLinesArray[0] > 10 && scaleBarLengthMeters > 10;

  // Middle number
  const midIndex = Math.round(divLinesArray.length / 2);
  let divNr = (calculatedScaleBarLengthMeters / divider) * midIndex;
  let divNrString = divNr.toLocaleString();
  elements.push({
    type: "text",
    text: divNrString,
    x:
      scaleBarPosition.x + divLinesArray[midIndex - 1] - divNrString.length - 2,
    y: scaleBarPosition.y - 3,
    size: 8,
    fontStyle: "normal",
    color,
  });

  // First additional division text (only if there is space)
  if (scaleBarHasSpace) {
    const dividerNrPosition = divLinesArray[0] / 5;
    divNr = calculatedScaleBarLengthMeters / divider / 5;
    divNrString = divNr.toLocaleString();

    const dividerStrLength =
      divNr % 1 !== 0 ? divNrString.length - 1 : divNrString.length;

    elements.push({
      type: "text",
      text: divNrString,
      x: scaleBarPosition.x + dividerNrPosition - dividerStrLength - 2,
      y: scaleBarPosition.y - 3,
      size: 8,
      fontStyle: "normal",
      color,
    });
  }
}
