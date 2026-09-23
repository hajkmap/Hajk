import { MM_PER_POINT } from "../options/defaults";
import {
  getTextHeight as measureTextHeight,
  getTextWidth,
  wrapTextToLines,
  getCenteredX,
  getRightAlignedPositions as computeRightAlignedPositions,
} from "./textMeasure";
import {
  getFittingScaleBarLength,
  getLengthText,
  getDivLinesArrayAndDivider,
} from "./scaleBarMath";
import { getPlacement } from "./placement";
import { getUserFriendlyScale } from "../utils/scale";
import { getImageForPdfFromUrl, generateQR } from "../utils/images";

/**
 * Creates an explicit, per-build layout context from a PrintModel instance.
 *
 * Historically, PrintLayout read and wrote mutable state directly on the
 * model (margin, textIconsMargin, scaleText, saveAsType, textColor,
 * scalebarMaxWidth...). This context makes that contract explicit: the
 * layout builder works only against this plain object for the duration of a
 * single build. Nothing on the model is mutated.
 *
 * The `scaleText` and `scalebarMaxWidth` fields are still mutable – but now
 * within the scope of one layout build instead of leaking between builds.
 */
export const createLayoutContext = (model) => {
  // ---- Immutable snapshot of model configuration ----
  const ctx = {
    margin: model.margin,
    textIconsMargin: model.textIconsMargin,
    saveAsType: model.saveAsType,
    textColor: model.textColor,
    textFontSize: model.textFontSize,
    textFontWeight: model.textFontWeight,
    date: model.date,
    copyright: model.copyright,
    disclaimer: model.disclaimer,
    logoUrl: model.logoUrl,
    northArrowUrl: model.northArrowUrl,
    logoMaxWidth: model.logoMaxWidth,
    northArrowMaxWidth: model.northArrowMaxWidth,
    mmPerPoint: MM_PER_POINT,

    // Used to gate QR code rendering and to publish image-loading warnings.
    enableAppStateInHash: model.mapConfig?.enableAppStateInHash,
    localObserver: model.localObserver,

    // Scale-to-meters mapping, used to decide whether divider texts can be drawn.
    scaleBarLengths: model.scaleBarLengths,

    // ---- Mutable during a single layout build ----
    scaleText: "",
    scalebarMaxWidth: 0,

    // NOTE: intentionally undefined. It is passed to canvas text measurement in
    // placement.js; the resulting invalid font string has always made the
    // measurement fall back to the browser's default font. Preserved as-is.
    fontSize: undefined,
  };

  // ---- Helper functions (bound to this context) ----
  ctx.generateQR = (url, qrSize) => generateQR(url, qrSize);

  ctx.getImageForPdfFromUrl = (url, maxWidth) =>
    getImageForPdfFromUrl(url, maxWidth);

  ctx.getPlacement = (
    placement,
    contentWidth,
    contentHeight,
    pdfWidth,
    pdfHeight,
    contentType
  ) =>
    getPlacement(
      ctx,
      placement,
      contentWidth,
      contentHeight,
      pdfWidth,
      pdfHeight,
      contentType
    );

  ctx.wrapTextToLines = (text, fontSize, maxWidth, fontWeight = "normal") =>
    wrapTextToLines(text, fontSize, maxWidth, fontWeight);

  ctx.getCenteredX = (text, fontSize, paperWidth, fontWeight = "normal") =>
    getCenteredX(text, fontSize, paperWidth, fontWeight);

  ctx.getTextWidth = (text, size) => getTextWidth(text, size);

  ctx.getTextHeight = (text, fontSize) =>
    measureTextHeight(text, fontSize, ctx.saveAsType);

  ctx.getRightAlignedPositions = (
    text,
    fontSize,
    xmargin,
    ymargin,
    paperWidth,
    options,
    fontWeight,
    maxWidth
  ) =>
    computeRightAlignedPositions(
      {
        text,
        fontSize,
        xmargin,
        ymargin,
        paperWidth,
        fontWeight,
        maxWidth,
        saveAsType: ctx.saveAsType,
        northArrowMaxWidth: ctx.northArrowMaxWidth,
        logoMaxWidth: ctx.logoMaxWidth,
        mmPerPoint: ctx.mmPerPoint,
        scalebarMaxWidth: ctx.scalebarMaxWidth,
      },
      options
    );

  ctx.getUserFriendlyScale = (scale) => getUserFriendlyScale(scale);

  ctx.getFittingScaleBarLength = (scale) =>
    getFittingScaleBarLength(model.scaleBarLengths, scale);

  ctx.getLengthText = (scaleBarLengthMeters) =>
    getLengthText(scaleBarLengthMeters);

  ctx.getDivLinesArrayAndDivider = (scaleBarLengthMeters, scaleBarLength) =>
    getDivLinesArrayAndDivider(scaleBarLengthMeters, scaleBarLength);

  return ctx;
};
