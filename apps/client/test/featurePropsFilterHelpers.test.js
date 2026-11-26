import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  age,
  between,
  contains,
  divideBy,
  endsWith,
  formatArea,
  formatLength,
  formatWithUnit,
  split,
  startsWith,
  truncate,
  urlEncode,
  year,
} from "../src/utils/featurePropsFilterHelpers.js";

// Run with: npm test
// The examples mirror the doc comments in FeaturePropsFilters.js.

const SV = "sv-SE";
const NBSP = " "; // Swedish group separator

describe("startsWith / endsWith", () => {
  test("return trueValue or falseValue", () => {
    assert.equal(
      startsWith("https://example.com", "https", "Secure", "Not secure"),
      "Secure"
    );
    assert.equal(
      endsWith("document-2024.pdf", ".pdf", "PDF document", "Other file"),
      "PDF document"
    );
    assert.equal(endsWith("a.jpg", ".pdf", "PDF", "Other"), "Other");
  });

  test("return the original value when trueValue/falseValue is missing", () => {
    assert.equal(startsWith("abc", "a"), "abc");
    assert.equal(endsWith("abc", "x", "Yes"), "abc");
  });

  test("accept a number from a chained filter", () => {
    assert.equal(startsWith(1.5, "1", "Large", "Small"), "Large");
    assert.equal(endsWith(1.5, "5", "Yes", "No"), "Yes");
  });

  test("throw without a search string", () => {
    assert.throws(() => startsWith("abc"));
    assert.throws(() => endsWith("abc"));
  });
});

describe("contains", () => {
  test("returns trueValue or falseValue", () => {
    assert.equal(contains("väg stängd", "stängd", "Closed", "Open"), "Closed");
    assert.equal(contains("öppen", "stängd", "Closed", "Open"), "Open");
  });

  test("is case-sensitive, chain toLower first", () => {
    assert.equal(contains("Stängd", "stängd", "Closed", "Open"), "Open");
    assert.equal(
      contains("Stängd".toLowerCase(), "stängd", "Closed", "Open"),
      "Closed"
    );
  });

  test("returns the original value when trueValue/falseValue is missing", () => {
    assert.equal(contains("abc", "b"), "abc");
    assert.equal(contains("abc", "x", "Yes"), "abc");
  });

  test("accepts a number from a chained filter", () => {
    assert.equal(contains(1500, "5", "Yes", "No"), "Yes");
  });

  test("throws without a search string", () => {
    assert.throws(() => contains("abc"));
  });
});

describe("urlEncode", () => {
  test("encodes for a query string or path segment", () => {
    assert.equal(urlEncode("Åby & Ösby"), "%C3%85by%20%26%20%C3%96sby");
    assert.equal(urlEncode("a/b?c=d#e"), "a%2Fb%3Fc%3Dd%23e");
  });

  test("accepts a number", () => {
    assert.equal(urlEncode(42), "42");
  });
});

describe("truncate", () => {
  const lorem = "Lorem ipsum dolor sit amet";

  test("cuts and appends the default suffix", () => {
    assert.equal(truncate(lorem, "20"), "Lorem ipsum dolor si…");
  });

  test("uses a custom suffix", () => {
    assert.equal(truncate(lorem, "20", "..."), "Lorem ipsum dolor si...");
  });

  test("returns short values unchanged", () => {
    assert.equal(truncate("short", "20"), "short");
    assert.equal(truncate("exactly", "7"), "exactly");
  });

  test("does not split an emoji at the cut point", () => {
    assert.equal(truncate("ab😀cd", "3"), "ab😀…");
  });

  test("accepts a number", () => {
    assert.equal(truncate(123456, "3"), "123…");
  });

  test("throws for an invalid length", () => {
    assert.throws(() => truncate(lorem));
    assert.throws(() => truncate(lorem, "abc"));
    assert.throws(() => truncate(lorem, "0"));
    assert.throws(() => truncate(lorem, "-3"));
    // parseInt would read these as 2
    assert.throws(() => truncate(lorem, "2abc"));
    assert.throws(() => truncate(lorem, "2.7"));
  });

  test("accepts a length with surrounding whitespace", () => {
    assert.equal(truncate(lorem, " 5 "), "Lorem…");
  });
});

describe("split", () => {
  test("returns the part at index", () => {
    assert.equal(split("a.b.c", ".", "1"), "b");
    assert.equal(split("a.b.c", "."), "a");
  });

  test("counts from the end with a negative index", () => {
    assert.equal(split("a.b.c", ".", "-1"), "c");
  });

  test("uses a literal separator, not a RegExp", () => {
    assert.equal(split("a.b+c", "+", "1"), "c");
    assert.equal(split("a*b", "*", "1"), "b");
    assert.equal(split("abc", ".", "0"), "abc");
  });

  test("returns an empty string when out of range", () => {
    assert.equal(split("a.b.c", ".", "3"), "");
    assert.equal(split("a.b.c", ".", "-4"), "");
  });

  test("accepts a number", () => {
    assert.equal(split(1.5, ".", "1"), "5");
  });

  test("throws for a missing separator or invalid index", () => {
    assert.throws(() => split("a.b.c"));
    assert.throws(() => split("a.b.c", ""));
    assert.throws(() => split("a.b.c", ".", "x"));
    assert.throws(() => split("a.b.c", ".", "1x"));
  });
});

describe("divideBy", () => {
  test("divides", () => {
    assert.equal(divideBy("1500", "1000"), 1.5);
    assert.equal(divideBy(3, "2"), 1.5);
  });

  test("throws for empty or non-numeric values", () => {
    assert.throws(() => divideBy("", "1000"));
    assert.throws(() => divideBy("  ", "1000"));
    assert.throws(() => divideBy("abc", "1000"));
    assert.throws(() => divideBy("1500", "abc"));
    assert.throws(() => divideBy("1500"));
  });

  test("throws for division by zero", () => {
    assert.throws(() => divideBy("1500", "0"));
  });
});

describe("formatWithUnit", () => {
  test("divides by the factor and appends the unit", () => {
    assert.equal(formatWithUnit("12500", 10000, "ha", "2", SV), "1,25 ha");
    assert.equal(formatWithUnit(1234.5, 1, "m", "1", "en-US"), "1,234.5 m");
  });
});

describe("formatArea", () => {
  test("auto picks m², ha or km² (Swedish)", () => {
    assert.equal(formatArea("12500", undefined, undefined, SV), "1,25 ha");
    assert.equal(formatArea("1500000", undefined, undefined, SV), "1,5 km²");
    assert.equal(
      formatArea("9999", undefined, undefined, SV),
      `9${NBSP}999 m²`
    );
    assert.equal(formatArea("10000", "auto", undefined, SV), "1 ha");
  });

  test("auto picks the unit from the rounded value", () => {
    // toFixed would round these down and keep the smaller unit
    assert.equal(formatArea("999995", undefined, "3", SV), "1 km²");
    assert.equal(formatArea("9999.9995", undefined, "3", SV), "1 ha");
    assert.equal(formatArea("999999.5", undefined, "4", SV), "1 km²");
    assert.equal(formatArea("9999.999", undefined, undefined, SV), "1 ha");
    assert.equal(
      formatArea("9999.99", undefined, undefined, SV),
      `9${NBSP}999,99 m²`
    );
    assert.equal(formatArea("9999.6", undefined, "0", SV), "1 ha");
    assert.equal(formatArea("999999", undefined, "0", SV), "1 km²");
  });

  test("forces a unit", () => {
    assert.equal(formatArea("12500", "m2", "0", SV), `12${NBSP}500 m²`);
    assert.equal(formatArea("1500000", "ha", undefined, SV), "150 ha");
    assert.equal(formatArea("12500", "km2", "3", SV), "0,013 km²");
  });

  test("uses the locale", () => {
    assert.equal(formatArea("12500", "m2", "0", "en-US"), "12,500 m²");
    assert.equal(formatArea("12500", undefined, undefined, "en-US"), "1.25 ha");
  });

  test("throws for empty or non-numeric values", () => {
    assert.throws(() => formatArea("", undefined, undefined, SV));
    assert.throws(() => formatArea(" ", undefined, undefined, SV));
    assert.throws(() => formatArea("abc", undefined, undefined, SV));
  });

  test("throws for an unknown unit or invalid decimals", () => {
    assert.throws(() => formatArea("12500", "acres", undefined, SV));
    assert.throws(() => formatArea("12500", "m2", "x", SV));
    assert.throws(() => formatArea("12500", "m2", "-1", SV));
    assert.throws(() => formatArea("12500", "m2", "21", SV));
  });
});

describe("formatLength", () => {
  test("auto picks m or km", () => {
    assert.equal(formatLength("1500", undefined, undefined, SV), "1,5 km");
    assert.equal(formatLength("999", undefined, undefined, SV), "999 m");
  });

  test("auto picks the unit from the rounded value", () => {
    assert.equal(formatLength("999.9999995", undefined, "6", SV), "1 km");
    assert.equal(formatLength("999.996", undefined, undefined, SV), "1 km");
    assert.equal(formatLength("999.994", undefined, undefined, SV), "999,99 m");
    // Swedish uses a real minus sign (U+2212)
    assert.equal(
      formatLength("-999.996", undefined, undefined, SV),
      "\u22121 km"
    );
  });

  test("forces a unit", () => {
    assert.equal(formatLength("1500", "m", "0", SV), `1${NBSP}500 m`);
    assert.equal(formatLength("250", "km", undefined, SV), "0,25 km");
  });

  test("uses the locale", () => {
    assert.equal(formatLength("1500", "m", "0", "en-US"), "1,500 m");
  });

  test("accepts a number from a chained filter", () => {
    assert.equal(formatLength(1500, undefined, undefined, SV), "1,5 km");
  });

  test("throws for empty values, unknown units and invalid decimals", () => {
    assert.throws(() => formatLength("", undefined, undefined, SV));
    assert.throws(() => formatLength("1500", "mi", undefined, SV));
    assert.throws(() => formatLength("1500", "m", "abc", SV));
    assert.throws(() => formatLength("1500", "m", "1e1", SV));
    assert.throws(() => formatLength("1500", "m", "2abc", SV));
  });

  test("does not show a negative zero", () => {
    assert.equal(formatLength("-0.001", undefined, undefined, SV), "0 m");
    assert.equal(formatArea("-0.4", undefined, "0", "en-US"), "0 m²");
    assert.equal(
      formatLength("-0.005", undefined, undefined, "en-US"),
      "-0.01 m"
    );
  });
});

describe("between", () => {
  test("is inclusive", () => {
    assert.equal(between("3", "0", "10", "Shallow", "Deep"), "Shallow");
    assert.equal(between("0", "0", "10", "Shallow", "Deep"), "Shallow");
    assert.equal(between("10", "0", "10", "Shallow", "Deep"), "Shallow");
    assert.equal(between("11", "0", "10", "Shallow", "Deep"), "Deep");
  });

  test("handles decimal and negative bounds", () => {
    assert.equal(
      between("-2", "-5", "0.5", "Near freezing", "Other"),
      "Near freezing"
    );
  });

  test("returns the original value when trueValue/falseValue is missing", () => {
    assert.equal(between("3", "0", "10"), "3");
    assert.equal(between("30", "0", "10", "Shallow"), "30");
  });

  test("returns the value unchanged when it or a bound is not a number", () => {
    assert.equal(between("", "0", "10", "Yes", "No"), "");
    assert.equal(between("  ", "0", "10", "Yes", "No"), "  ");
    assert.equal(between("abc", "0", "10", "Yes", "No"), "abc");
    assert.equal(between("3", "x", "10", "Yes", "No"), "3");
    assert.equal(between("3", "0", undefined, "Yes", "No"), "3");
  });

  test("accepts a number from a chained filter", () => {
    assert.equal(between(1.5, "1", "2", "Yes", "No"), "Yes");
  });
});

describe("year", () => {
  test("reads the year", () => {
    assert.equal(year("2021-06-03T13:04:12Z"), "2021");
    assert.equal(year("20210603"), "2021");
  });

  test("reads a date without a time as a local date", () => {
    // Would be 2020 west of UTC if parsed as UTC midnight (see npm test with TZ)
    assert.equal(year("2021-01-01"), "2021");
    assert.equal(year("20210101"), "2021");
    assert.equal(year("0050-06-01"), "50");
  });

  test("accepts a Date from dateAddDays", () => {
    const d = new Date("2021-12-31T12:00:00Z");
    d.setDate(d.getDate() + 1);
    assert.equal(year(d), "2022");
  });

  test("throws for invalid dates", () => {
    assert.throws(() => year(""));
    assert.throws(() => year("not a date"));
    assert.throws(() => year(2021));
    assert.throws(() => year("2021-02-30"));
    assert.throws(() => year("2021-13-01"));
  });
});

describe("age", () => {
  const now = new Date(2026, 10, 26, 12, 0, 0); // 2026-11-26 12:00 local

  test("auto picks the largest whole unit", () => {
    assert.equal(
      age(new Date(2026, 10, 23, 10, 0), "auto", SV, now),
      "för 3 dagar sedan"
    );
    assert.equal(
      age(new Date(2024, 5, 1), undefined, SV, now),
      "för 2 år sedan"
    );
    assert.equal(
      age(new Date(2026, 10, 26, 9, 0), undefined, SV, now),
      "för 3 timmar sedan"
    );
    assert.equal(
      age(new Date(2026, 10, 26, 11, 15), undefined, SV, now),
      "för 45 minuter sedan"
    );
  });

  test("yesterday and future dates", () => {
    assert.equal(
      age(new Date(2026, 10, 25, 11, 0), undefined, SV, now),
      "i går"
    );
    assert.equal(
      age(new Date(2026, 10, 29, 12, 0), undefined, SV, now),
      "om 3 dagar"
    );
  });

  test("under a minute", () => {
    assert.equal(
      age(new Date(2026, 10, 26, 11, 59, 30), undefined, SV, now),
      "denna minut"
    );
    assert.equal(age(now, undefined, SV, now), "denna minut");
  });

  test("years and months are calendar differences", () => {
    assert.equal(age("1979-12-01", "years", SV, now), "för 46 år sedan");
    assert.equal(
      age(new Date(2026, 9, 27), undefined, SV, now),
      "för 30 dagar sedan"
    );
    assert.equal(
      age(new Date(2026, 9, 26), "months", SV, now),
      "för 1 månad sedan"
    );
  });

  test("days are calendar days", () => {
    const night = new Date(2026, 10, 26, 1, 0);
    // 2 hours ago, on the previous date: auto uses days only from 24 hours on
    assert.equal(
      age(new Date(2026, 10, 25, 23, 0), undefined, SV, night),
      "för 2 timmar sedan"
    );
    assert.equal(
      age(new Date(2026, 10, 25, 23, 0), "days", SV, night),
      "i går"
    );
    // 25 hours ago, the previous date
    assert.equal(
      age(new Date(2026, 10, 25, 0, 0), undefined, SV, night),
      "i går"
    );
    // 26 hours ago, two dates back
    assert.equal(
      age(new Date(2026, 10, 24, 23, 0), undefined, SV, night),
      "i förrgår"
    );
    assert.equal(
      age(new Date(2026, 10, 26, 0, 30), "days", SV, night),
      "i dag"
    );
  });

  test("seconds or minutes across midnight are not yesterday/tomorrow", () => {
    assert.equal(
      age(
        new Date(2026, 1, 28, 23, 59, 59),
        undefined,
        SV,
        new Date(2026, 2, 1, 0, 0, 30)
      ),
      "denna minut"
    );
    assert.equal(
      age(
        new Date(2026, 10, 27, 0, 5),
        undefined,
        SV,
        new Date(2026, 10, 26, 23, 55)
      ),
      "om 10 minuter"
    );
  });

  test("days are not affected by DST", () => {
    // Contains the 23-hour day in Sweden (2026-03-29), and in other zones
    // with a spring change on that date
    const value = new Date(2026, 2, 28, 12, 0);
    const later = new Date(2026, 2, 31, 12, 0);
    assert.equal(age(value, "days", SV, later), "för 3 dagar sedan");
  });

  test("one elapsed year or month is not called last year/month", () => {
    // 2024 is two calendar years before 2026, so "förra året" would be wrong
    const jan = new Date(2026, 0, 5);
    assert.equal(age("2024-12-20", undefined, SV, jan), "för 1 år sedan");
    assert.equal(age("2025-11-20", "months", SV, jan), "för 1 månad sedan");
    assert.equal(age("2025-12-20", "years", SV, jan), "för 0 år sedan");
    assert.equal(age("2026-12-20", "years", SV, jan), "om 0 år");
  });

  test("a date without a time is compared with today", () => {
    const afternoon = new Date(2026, 10, 26, 15, 0);
    assert.equal(age("2026-11-26", undefined, SV, afternoon), "i dag");
    assert.equal(age("20261126", undefined, SV, afternoon), "i dag");
    assert.equal(age("2026-11-25", undefined, SV, afternoon), "i går");
    assert.equal(age("2026-11-27", undefined, SV, afternoon), "i morgon");
    // Exactly one month ahead, although the current time is past midnight
    assert.equal(age("2026-12-26", undefined, SV, afternoon), "om 1 månad");
    assert.equal(age("2025-11-26", undefined, SV, afternoon), "för 1 år sedan");
  });

  test("forces a unit", () => {
    assert.equal(
      age(new Date(2026, 10, 23, 12, 0), "hours", SV, now),
      "för 72 timmar sedan"
    );
  });

  test("accepts 20210603 and uses the locale", () => {
    assert.equal(age("20210603", "years", "en-US", now), "5 years ago");
  });

  test("throws for invalid dates or unknown units", () => {
    assert.throws(() => age("", undefined, SV, now));
    assert.throws(() => age("not a date", undefined, SV, now));
    assert.throws(() => age("2024-01-01", "weeks", SV, now));
  });
});
