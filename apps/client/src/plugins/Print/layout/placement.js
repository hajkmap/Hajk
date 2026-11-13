import { getTextWidth } from "./textMeasure";

/**
 * Computes the x/y position for a piece of content on the page.
 *
 * This function used to live on PrintModel and read mutable instance state.
 * It now operates purely on an explicit layout context (see layout/context.js).
 *
 * @param {Object} ctx Layout context.
 * @param {string} placement Chosen placement on the page.
 * @param {number} contentWidth
 * @param {number} contentHeight
 * @param {number} pdfWidth
 * @param {number} pdfHeight
 * @param {string} contentType "qrCode", "scaleBar" or undefined.
 * @returns {Object} x-axis and y-axis placement in points.
 */
export const getPlacement = (
  ctx,
  placement,
  contentWidth,
  contentHeight,
  pdfWidth,
  pdfHeight,
  contentType
) => {
  // We must take the potential margin around the map-image into account (ctx.margin)
  // And the extra margin for textIconsMargin.
  // And the extra extra margin for qrcode image
  //
  // The white border is drawn as a stroke centered on the page edge, so its visible
  // inner width = 2.75 * ctx.margin (half of lineWidth 5.5 * margin in PrintLayout).
  // Using 2.75 * ctx.margin as the base aligns elements with the map's edge boundary.
  // textIconsMargin adds extra inward padding when elements should NOT be in the margin
  // (textIconsMargin=6); it is 0 when elements intentionally go in the margin.
  const margin = 2.75 * ctx.margin + ctx.textIconsMargin;
  // Here we simply say if content that is going to be placed is a qr code...
  // we need to adjust it slightly because the qr code is bigger than the other icons.
  const qrMargin =
    (contentType === "qrCode" && ctx.textIconsMargin) === 0 ? 3 : 0;

  let pdfPlacement = { x: 0, y: 0 };
  if (placement === "bottomLeft") {
    pdfPlacement.x = margin;
    pdfPlacement.y = margin - qrMargin;
  } else if (placement === "bottomRight") {
    if (contentType === "scaleBar") {
      // Check if the text is longer than the scalebar to get the one with most width.
      // NOTE: ctx.fontSize is intentionally left undefined by the context – the
      // resulting invalid canvas font string makes measureText fall back to the
      // browser default font. This has always been the behavior; preserve it.
      const textLength = getTextWidth(ctx.scaleText, ctx.fontSize);
      // If the contentWidth aka the scalebar and not the text, add some extra padding.
      ctx.scalebarMaxWidth =
        contentWidth > ctx.scalebarMaxWidth ? contentWidth + 25 : textLength;
      pdfPlacement.x = pdfWidth - margin - ctx.scalebarMaxWidth;
      pdfPlacement.y = margin;
    } else {
      pdfPlacement.x = pdfWidth - contentWidth - margin;
      pdfPlacement.y = margin - qrMargin + 10;
    }
  } else if (placement === "topRight") {
    if (contentType === "scaleBar") {
      // Check if the text is longer than the scalebar to get the one with most width.
      const scaleTextWidth = getTextWidth(ctx.scaleText, ctx.fontSize);
      // If the contentWidth aka the scalebar and not the text, add some extra padding.
      const scalebarMaxWidth =
        contentWidth > scaleTextWidth ? contentWidth + 25 : scaleTextWidth;
      pdfPlacement.x = pdfWidth - margin - scalebarMaxWidth;
      pdfPlacement.y = pdfHeight - contentHeight - margin - 20;
    } else {
      pdfPlacement.x = pdfWidth - contentWidth - margin;
      pdfPlacement.y = pdfHeight - contentHeight - margin + qrMargin;
    }
  } else {
    pdfPlacement.x = margin;
    pdfPlacement.y = pdfHeight - contentHeight - margin + qrMargin;
  }
  return pdfPlacement;
};
