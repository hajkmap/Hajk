const fontFamily = [
  '"Inter Variable"',
  '"Segoe UI Variable Text"',
  '"Segoe UI"',
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(",");

export default {
  fontFamily,
  h1: {
    // Page titles.
    fontSize: "2rem",
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
  },
  h3: {
    // Large figures, e.g. the counts on the start page.
    fontSize: "2.5rem",
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
  },
  h5: {
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: "-0.005em",
  },
  h6: {
    // Section headings (form panels, accordions, cards, dialog titles).
    fontSize: "1rem",
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: "-0.005em",
  },
  subtitle1: {
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  subtitle2: {
    // Sub-headings and item titles inside a section.
    fontSize: "0.875rem",
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  body1: {
    fontSize: "1rem",
    lineHeight: 1.6,
    letterSpacing: 0,
  },
  body2: {
    fontSize: "0.875rem",
    lineHeight: 1.55,
    letterSpacing: 0,
  },
  button: {
    fontWeight: 600,
    letterSpacing: "0.01em",
    textTransform: "none" as const,
  },
  caption: {
    fontSize: "0.75rem",
    lineHeight: 1.5,
    letterSpacing: "0.01em",
  },
  overline: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    lineHeight: 2,
    letterSpacing: "0.08em",
  },
};
