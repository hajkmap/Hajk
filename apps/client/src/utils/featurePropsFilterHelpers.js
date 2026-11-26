// Pure helpers for the Infoclick filters in
// components/FeatureInfo/FeaturePropsFilters.js. This file must not import
// anything, so that it can be unit tested with plain `node --test` (see test/).
//
// Environment-dependent values are parameters: `locale` (pass
// getBrowserLocale()) and, for `age`, `now`.
//
// Every argument from a template arrives as a string. Invalid input throws, so
// that execFilter() logs a warning and passes the value through unchanged.

// ---- Shared ----------------------------------------------------------------

// '' and whitespace are not numbers here, although isNaN('') is false.
function isNumeric(value) {
  return String(value).trim() !== "" && !isNaN(value);
}

function toNumber(value) {
  if (!isNumeric(value)) {
    throw new Error("Value should be a number");
  }
  return Number(value);
}

// Strict: parseInt would read '2abc' as 2 and '1e1' as 1
function parseInteger(value, name) {
  const s = String(value).trim();
  if (!/^[+-]?\d+$/.test(s)) {
    throw new Error(`${name} should be an integer`);
  }
  return Number(s);
}

function parseDecimals(decimals = 2) {
  const n = parseInteger(decimals, "decimals");
  if (n < 0 || n > 20) {
    throw new Error("decimals should be between 0 and 20");
  }
  return n;
}

// Local copy of fixDate() in FeaturePropsFilters.js: 20210603 -> 2021-06-03
function fixDate(value) {
  if (value.indexOf("-") <= -1) {
    value = `${value.substr(0, 4)}-${value.substr(4, 2)}-${value.substr(6, 2)}`;
  }
  return value;
}

// Accepts a date string (also 20210603) or a Date from dateAddDays/dateAddHours.
// Date-only strings (2021-06-03) are read as local dates. new Date() would read
// them as UTC midnight, which is the day before west of UTC.
// Returns { date, dateOnly }.
function toDate(value) {
  let date;
  let dateOnly = false;
  if (typeof value === "string") {
    value = fixDate(value);
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (ymd) {
      const [y, m, d] = ymd.slice(1).map(Number);
      date = new Date(y, m - 1, d);
      date.setFullYear(y); // new Date() maps years 0-99 to 1900-1999
      // new Date(2021, 1, 30) rolls over to March instead of failing
      if (date.getMonth() !== m - 1 || date.getDate() !== d) {
        throw new Error("Value should be a valid date");
      }
      dateOnly = true;
    } else {
      date = new Date(value);
    }
  } else if (value instanceof Date) {
    date = value;
  } else {
    throw new Error("Value should be a date");
  }
  if (isNaN(date.getTime())) {
    throw new Error("Value should be a valid date");
  }
  return { date, dateOnly };
}

// ---- Text ------------------------------------------------------------------

// startsWith, endsWith and contains. Missing trueValue/falseValue returns the value.
function textTest(method) {
  return (value, test, trueValue, falseValue) => {
    // Can be a number or a Date when chained after another filter
    value = String(value);
    if (test === undefined) {
      // Otherwise 'abc'.includes(undefined) would search for "undefined"
      throw new Error("A string to search for is required");
    }
    return value[method](test) ? trueValue || value : falseValue || value;
  };
}

export const startsWith = textTest("startsWith");
export const endsWith = textTest("endsWith");
export const contains = textTest("includes");

export function urlEncode(value) {
  return encodeURIComponent(String(value));
}

export function truncate(value, length, suffix = "…") {
  value = String(value);
  const n = parseInteger(length, "length");
  if (n < 1) {
    throw new Error("length should be a positive integer");
  }
  // Array.from splits on code points, so emoji aren't cut in half
  const chars = Array.from(value);
  return chars.length > n ? chars.slice(0, n).join("") + suffix : value;
}

export function split(value, separator, index = 0) {
  value = String(value);
  if (typeof separator !== "string" || separator === "") {
    throw new Error("A separator is required");
  }
  const i = parseInteger(index, "index");
  // Literal separator (not a RegExp). Out of range gives "", so it chains with default.
  return value.split(separator).at(i) ?? "";
}

// ---- Numbers ---------------------------------------------------------------

export function divideBy(value, divisor) {
  const n = toNumber(value);
  if (!isNumeric(divisor)) {
    throw new Error("Divisor should be a number");
  }
  if (Number(divisor) === 0) {
    throw new Error("Division by zero");
  }
  return n / Number(divisor);
}

// Rounds like toLocaleString does (Intl rounding is the same in every
// locale). toFixed doesn't: (0.015).toFixed(2) is "0.01", Intl gives 0.02.
function roundAsShown(n, decimals) {
  return Number(
    new Intl.NumberFormat("en", {
      maximumFractionDigits: decimals,
      useGrouping: false,
    }).format(n)
  );
}

export function formatWithUnit(value, factor, unitLabel, decimals, locale) {
  const d = parseDecimals(decimals);
  let n = toNumber(value) / factor;
  if (roundAsShown(n, d) === 0) {
    n = 0; // Otherwise -0.001 is shown as "−0"
  }
  const formatted = n.toLocaleString(locale, { maximumFractionDigits: d });
  return `${formatted} ${unitLabel}`;
}

// In auto order. 'auto' uses a unit while the value is below autoBelow (in the
// base unit), otherwise the last one.
const AREA_UNITS = {
  m2: { factor: 1, label: "m²", autoBelow: 10000 },
  ha: { factor: 10000, label: "ha", autoBelow: 1000000 },
  km2: { factor: 1000000, label: "km²" },
};

const LENGTH_UNITS = {
  m: { factor: 1, label: "m", autoBelow: 1000 },
  km: { factor: 1000, label: "km" },
};

function formatMeasure(value, unit, decimals, locale, units) {
  const n = toNumber(value);
  const d = parseDecimals(decimals);
  let key = unit;
  if (unit === "auto") {
    const keys = Object.keys(units);
    // Compare the value as it will be shown, so 999.996 m (shown as
    // "1 000 m" with 2 decimals) becomes 1 km. Compared in the unit itself,
    // as multiplying back by the factor could add float errors.
    key =
      keys.find(
        (k) =>
          roundAsShown(Math.abs(n) / units[k].factor, d) <
          units[k].autoBelow / units[k].factor
      ) ?? keys[keys.length - 1];
  }
  if (!Object.hasOwn(units, key)) {
    throw new Error(`Unknown unit '${unit}'`);
  }
  const { factor, label } = units[key];
  return formatWithUnit(n, factor, label, d, locale);
}

// Input in m²
export function formatArea(value, unit = "auto", decimals = 2, locale) {
  return formatMeasure(value, unit, decimals, locale, AREA_UNITS);
}

// Input in m
export function formatLength(value, unit = "auto", decimals = 2, locale) {
  return formatMeasure(value, unit, decimals, locale, LENGTH_UNITS);
}

// Inclusive. Non-numeric value or bounds return the value unchanged, like lt/gt.
export function between(value, min, max, trueValue, falseValue) {
  if (!isNumeric(value) || !isNumeric(min) || !isNumeric(max)) {
    return value;
  }
  const n = Number(value);
  return n >= Number(min) && n <= Number(max)
    ? trueValue || value
    : falseValue || value;
}

// ---- Dates -----------------------------------------------------------------

// Local time. Returned as a string, so it can be chained with string filters
// such as equals('2021', ...).
export function year(value) {
  return String(toDate(value).date.getFullYear());
}

// Whole calendar months from `from` to `to` (negative if `to` is earlier).
function calendarMonths(from, to) {
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  // Position within the month (day + time of day), to see if the last month is whole
  const key = (d) =>
    d.getDate() * 86400000 +
    ((d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds()) * 1000 +
    d.getMilliseconds();
  if (months > 0 && key(to) < key(from)) {
    months--;
  } else if (months < 0 && key(to) > key(from)) {
    months++;
  }
  return months;
}

const AGE_UNITS = {
  years: "year",
  months: "month",
  days: "day",
  hours: "hour",
  minutes: "minute",
};

// Calendar days from `from` to `to`, ignoring the time of day (and DST)
function calendarDays(from, to) {
  const day = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((day(to) - day(from)) / 86400000);
}

export function age(value, unit = "auto", locale, now = new Date()) {
  if (unit !== "auto" && !Object.hasOwn(AGE_UNITS, unit)) {
    throw new Error(`Unknown unit '${unit}'`);
  }
  const { date, dateOnly } = toDate(value);

  // A date without a time is compared with today, not with the current time,
  // so today's date reads "today" and not "15 hours ago".
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nowForDays = dateOnly ? today : now;

  // Negative for dates in the past, which is what RelativeTimeFormat expects.
  // Years, months, hours and minutes are whole elapsed units. Days are
  // calendar days, so that "yesterday" means the previous date.
  const ms = date.getTime() - now.getTime();
  const months = calendarMonths(nowForDays, date);
  const diffs = {
    years: Math.trunc(months / 12),
    months,
    days: calendarDays(now, date),
    hours: Math.trunc(ms / 3600000),
    minutes: Math.trunc(ms / 60000),
  };

  let key = unit;
  if (unit === "auto") {
    // The largest whole unit. A date without a time stops at days ("today").
    // A value with a time uses days only from 24 hours on, so something
    // a minute old just after midnight doesn't read "yesterday".
    const candidates = dateOnly
      ? ["years", "months", "days"]
      : Object.keys(AGE_UNITS).filter(
          (k) => k !== "days" || Math.abs(ms) >= 86400000
        );
    key =
      candidates.find((k) => diffs[k] !== 0) ?? (dateOnly ? "days" : "minutes");
  }

  // Words such as "yesterday", "last year" or "this hour" are calendar terms.
  // Only days are counted by calendar, so only they (and "this minute", for
  // less than a minute in auto) may use them. Otherwise one elapsed year
  // could read "last year" for a date two calendar years back.
  const n = diffs[key];
  const useWords = key === "days" || (unit === "auto" && n === 0);
  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: useWords ? "auto" : "always",
  });
  // Keep the direction for 0 ("0 years ago", not "in 0 years")
  const signed = n === 0 && ms < 0 ? -0 : n;
  return rtf.format(useWords ? n || 0 : signed, AGE_UNITS[key]);
}
