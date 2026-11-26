import AppModel from "../../models/AppModel";
import HajkTransformer from "../../utils/HajkTransformer";
import { getBrowserLocale } from "../../utils/locale";
import {
  age,
  between,
  contains,
  divideBy,
  endsWith,
  formatArea,
  formatLength,
  split,
  startsWith,
  truncate,
  urlEncode,
  year,
} from "../../utils/featurePropsFilterHelpers";

class PropFilters {
  constructor() {
    this.filters = {};
    this.properties = {};
    return this;
  }

  applyFilters(properties, input) {
    this.properties = properties; // Make properties available for the filters

    let filters = input.split("|");
    const key = filters.shift().trim();

    let value = null;

    if (key.indexOf("'") === 0) {
      // handle raw data, not from props. Can be good to have, especially when testing.
      // example: {'2021-06-03T13:04:12Z'|date}
      value = key.substring(1, key.length - 1);
    } else {
      value = this.properties[key];

      if (typeof value === "boolean" || typeof value === "number") {
        // We must convert to string to avoid boolean or numeric comparisons
        // Everything should be stringified
        value = String(value);
      }

      if (!value) {
        value = "";
      }
    }

    // Handle different kind of arguments using this RegEx
    // Previously split(',') was used but that of course prevented ',' etc to be used in arguments.... (It broke the rendering)
    const splitArgsRegEx = /^''|'[^']+'|^\d+\.?\d{1,}$|[a-z_0-9]+/gm;

    // Regex to match a property name when testing if it's a nested property.
    const isPropertyRegEx = /^[a-z][a-z_0-9]+$/gm;

    filters.forEach((inFilter) => {
      // This is where we handle chained filters.
      const argsStart = inFilter.indexOf("(");
      let filterName = inFilter;
      let args = [];

      if (argsStart > -1) {
        filterName = inFilter.substr(0, argsStart);
        args = inFilter
          .substring(argsStart + 1, inFilter.lastIndexOf(")"))
          .match(splitArgsRegEx);
        args.forEach((v, i, a) => {
          v = v.trim();
          if (isPropertyRegEx.test(v)) {
            // The value is in fact a nested property! Replace the value!
            a[i] = this.properties[v] ? String(this.properties[v]).trim() : "";
          } else {
            a[i] = this.freeString(v);
          }
        });
      }

      value = this.execFilter(filterName, value, args);
    });

    return value;
  }

  execFilter(filterName, value, args) {
    const filter = this.get(filterName);

    if (filter) {
      try {
        return filter.func.apply(this, [value, ...args]);
      } catch (err) {
        console.warn(
          `FeaturePropFilters: Could not apply filter '${filterName}' on value ${value} with args ${args},`,
          err
        );
      }
    }

    return value;
  }

  freeString(s) {
    // Free a string contained inside ''
    if (s.indexOf("'") === 0) {
      s = s.substring(1, s.length - 1);
    }
    return s;
  }

  get(key) {
    if (this.filters[key]) {
      return this.filters[key];
    } else {
      console.warn(
        `FeaturePropFilters: Could not find filter with name '${key}'`
      );
    }
    return null;
  }

  add(key, f) {
    this.filters[key] = {
      func: f,
    };
  }

  addAlias(key, targetKey) {
    this.add(key, this.get(targetKey).func);
  }
}

function fixDate(value) {
  if (value.indexOf("-") <= -1) {
    value = `${value.substr(0, 4)}-${value.substr(4, 2)}-${value.substr(6, 2)}`;
  }
  return value;
}

const filters = new PropFilters();

// ---- Add filters below -----------------------------------------------------

/*
  roundToDecimals
  Example:
  {'45.32465456'|roundToDecimals(2,[1|0])}
  outputs: 45,32
*/
filters.add(
  "roundToDecimals",
  function (value, numDecimals, retOriginalValueIfParamsNotNumbers = 0) {
    if (isNaN(value) || isNaN(numDecimals)) {
      if (parseInt(retOriginalValueIfParamsNotNumbers) === 1) {
        return value;
      } else {
        throw new Error("Arguments should be numbers");
      }
    }
    // We need to double wrap for toLocaleString to work as toFixed returns a string.
    return parseFloat(
      parseFloat(value).toFixed(parseInt(numDecimals))
    ).toLocaleString(getBrowserLocale());
  }
);

/*
  replace
  Example:
  {'This is working BAD!!'|replace('BAD','GOOD')}
  outputs: This is working GOOD!!
*/
filters.add("replace", function (value, replace, withString) {
  return value.replace(new RegExp(replace, "gm"), withString);
});

/*
  default/fallback
  Example:
  {''|default('No value found')}
  outputs: No value
*/
filters.add("default", function (value, defaultValue) {
  return value === "" ? defaultValue : value;
});
filters.addAlias("fallback", "default");

/*
  lt - lessThan
  If lessValue or greaterValue is an empty string the original value will be returned
  Example:
  {10.3|lt('11', 'LessThan', 'GreaterThan')}
  outputs: 'LessThan'
  {10.3|lt('11', '', 'GreaterThan')}
  outputs: 10.3
*/
filters.add("lt", function (value, test, lessValue, greaterValue) {
  if (isNaN(value) || isNaN(test)) {
    return value;
  }
  const val = typeof value === "string" ? parseFloat(value) : value;
  const t = typeof test === "string" ? parseFloat(test) : test;

  if (val < t) {
    return (typeof lessValue === "string" && lessValue.length === 0) ||
      !lessValue
      ? value
      : lessValue;
  } else {
    return (typeof greaterValue === "string" && greaterValue.length === 0) ||
      !greaterValue
      ? value
      : greaterValue;
  }
});

/*
  gt - greaterThan
  If lessValue or greaterValue is an empty string the original value will be returned
  Example:
  {10.3|gt('9.2', 'GreaterThan', 'LessThan')}
  outputs: 'GreaterThan'
  {10.3|gt('9.2', '', 'LessThan')}
  outputs: 10.3
*/
filters.add("gt", function (value, test, greaterValue, lessValue) {
  if (isNaN(value) || isNaN(test)) {
    return value;
  }
  const val = typeof value === "string" ? parseFloat(value) : value;
  const t = typeof test === "string" ? parseFloat(test) : test;

  if (val > t) {
    return (typeof greaterValue === "string" && greaterValue.length === 0) ||
      !greaterValue
      ? value
      : greaterValue;
  } else {
    return (typeof lessValue === "string" && lessValue.length === 0) ||
      !lessValue
      ? value
      : lessValue;
  }
});

/*
  between
  Inclusive range check. If the value or min/max is not a number, the original
  value is returned. If trueValue or falseValue is missing, the original value
  is returned. Decimal and negative bounds must be quoted.
  Example:
  {'3'|between(0, 10, 'Shallow', 'Deep')}
  outputs: Shallow
  {'-2'|between('-5', '0.5', 'Near freezing', 'Other')}
  outputs: Near freezing
*/
filters.add("between", between);

/*
  naNToNum
  If value is NaN or undef returns num as a number, otherwise returns value
  Example:
  {NaN|naNToNum('-1000')}
  outputs: -1000
  {10.3|naNToNum('-1000')}
  outputs: 10.3
*/
filters.add("naNToNum", function (value, num) {
  if (!value || isNaN(value)) {
    return parseFloat(num);
  } else {
    return value;
  }
});

/*
  hasValue
  Example:
  {'test'|hasValue('It has a value', 'Sorry, no value here.')}
  outputs: It has a value
*/
filters.add("hasValue", function (value, trueValue = "", falseValue = "") {
  return value === "" ? falseValue : trueValue;
});

/*
  equals
  Example:
  {'true'|equals('true', 'yes', 'no')}
  outputs: yes
*/
filters.add("equals", function (value, test, trueValue, falseValue) {
  return value === test ? trueValue : falseValue || value;
});

/*
  notEquals
  Example:
  {'false'|notEquals('true', 'This value is not true', 'This value is true')}
  outputs: This value is not false
*/
filters.add("notEquals", function (value, test, falseValue, trueValue) {
  return value !== test ? falseValue : trueValue || value;
});

/*
  startsWith
  Example:
  {'https://example.com'|startsWith('https', 'Secure', 'Not secure')}
  outputs: Secure
*/
filters.add("startsWith", startsWith);

/*
  endsWith
  Example:
  {'document-2024.pdf'|endsWith('.pdf', 'PDF document', 'Other file')}
  outputs: PDF document
*/
filters.add("endsWith", endsWith);

/*
  contains
  Case-sensitive, like startsWith/endsWith: 'stängd' does not match 'Stängd'.
  Chain toLower first if needed. If trueValue or falseValue is missing, the
  original value is returned.
  Example:
  {'Stängd för säsongen'|toLower|contains('stängd', 'Closed', 'Open')}
  outputs: Closed
*/
filters.add("contains", contains);

/*
  urlEncode
  Encodes a value for use in a URL's query string or path segment.
  Meant for absolute URLs: relative Markdown links are encoded once more by
  the Infoclick, which turns % into %25.
  Example:
  https://example.com/search?q={name|urlEncode}
  outputs (name = 'Åby & Ösby'): https://example.com/search?q=%C3%85by%20%26%20%C3%96sby
*/
filters.add("urlEncode", urlEncode);

/*
  datetime
  Example:
  {'2021-06-03T13:04:12Z'|datetime}
  outputs: 2021-06-03 13:04:12
*/
filters.add("datetime", function (value) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(getBrowserLocale());
});

/*
  date
  Example:
  {'2021-06-03T13:04:12Z'|date}
  outputs: 2021-06-03
*/
filters.add("date", function (value) {
  value = fixDate(value);
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(getBrowserLocale());
});

/*
  time
  Example:
  {'2021-06-03T13:04:12Z'|time}
  outputs: 13:04:12
*/
filters.add("time", function (value) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString(getBrowserLocale());
});

/*
  dateAddDays
  Example:
  {'2021-06-03T13:04:12Z'|dateAddDays(1)|datetime}
  outputs: 2021-06-04 13:04
  Note: negative value will substract days
*/
filters.add("dateAddDays", function (value, days) {
  value = fixDate(value);
  const date = typeof value === "string" ? new Date(value) : value;
  date.setDate(date.getDate() + parseFloat(days));
  return date;
});

/*
  dateAddHours
  Example:
  {'2021-06-03T13:04:12Z'|dateAddHours(1)|datetime}
  outputs: 2021-06-03 14:04
  Note: negative value will substract hours
*/
filters.add("dateAddHours", function (value, hours) {
  value = fixDate(value);
  const date = typeof value === "string" ? new Date(value) : value;
  date.setTime(date.getTime() + parseFloat(hours) * 60 * 60 * 1000);
  return date;
});

/*
  year
  Uses local time. A date without a time (2021-06-03 or 20210603) is read as a
  local date. Also accepts the output of dateAddDays/dateAddHours.
  Example:
  {'2021-06-03T13:04:12Z'|year}
  outputs: 2021
  {'2021-12-31T12:00:00Z'|dateAddDays(1)|year}
  outputs: 2022
*/
filters.add("year", year);

/*
  age(unit = 'auto')
  Relative time, in the past or the future, in the browser's language.
  unit: 'auto' (the largest whole unit), 'years', 'months', 'days', 'hours' or
  'minutes'. Years, months, hours and minutes are whole elapsed units (one
  year ago reads "för 1 år sedan"). Days are calendar days, so "i går" means
  the previous date. In 'auto', a value with a time uses days only from 24
  hours on, so a few minutes ago never reads "i går". A date without a time is
  compared with today, so 'auto' goes no further than days ("i dag").
  Example:
  {'2026-11-23T10:00:00'|age}
  outputs (on 2026-11-26): för 3 dagar sedan
  {'1979-12-01'|age('years')}
  outputs (on 2026-11-26): för 46 år sedan
  {'2026-11-25'|age}
  outputs (on 2026-11-26): i går
*/
filters.add("age", (value, unit) => age(value, unit, getBrowserLocale()));

/*
  formatNumber
  Example:
  {'98000'|formatNumber}
  outputs: 98 000
*/
filters.add("formatNumber", function (value) {
  if (isNaN(value)) {
    throw new Error("Argument should be a number");
  }
  return Number(value).toLocaleString(getBrowserLocale());
});

/*
  formatArea(unit = 'auto', decimals = 2)
  Input in m². unit: 'auto' (below 10 000 m² -> m², below 1 000 000 m² -> ha,
  otherwise km²), 'm2', 'ha' or 'km2'. Note that 'auto' shows 150 ha as
  1,5 km²: use formatArea('ha') to keep hectares for large areas.
  Example:
  {'12500'|formatArea}
  outputs: 1,25 ha
  {'12500'|formatArea('m2', 0)}
  outputs: 12 500 m²
  {'1500000'|formatArea}
  outputs: 1,5 km²
  {'1500000'|formatArea('ha')}
  outputs: 150 ha
*/
filters.add("formatArea", (value, unit, decimals) =>
  formatArea(value, unit, decimals, getBrowserLocale())
);

/*
  formatLength(unit = 'auto', decimals = 2)
  Input in m. unit: 'auto' (below 1 000 m -> m, otherwise km), 'm' or 'km'.
  Example:
  {'1500'|formatLength}
  outputs: 1,5 km
  {'1500'|formatLength('m', 0)}
  outputs: 1 500 m
*/
filters.add("formatLength", (value, unit, decimals) =>
  formatLength(value, unit, decimals, getBrowserLocale())
);

/*
  multiplyBy
  Example:
  {'0.08'|multiplyBy(100)}
  outputs: 8
*/
filters.add("multiplyBy", function (value, multiplier) {
  if (isNaN(value) || isNaN(multiplier)) {
    throw new Error("Arguments should be numbers");
  }
  return value * multiplier;
});

/*
  divideBy
  Example:
  {'1500'|divideBy(1000)}
  outputs: 1.5
*/
filters.add("divideBy", divideBy);

/*
  map
  Example:
  {'1'|map('0:No,1:Yes')}
  outputs: Yes
*/
filters.add("map", function (value, mappingStr) {
  if (!mappingStr) {
    throw new Error("A mapping string is required");
  }
  const mapping = mappingStr.split(",").reduce((acc, pair) => {
    // Use indexOf to split on the first ":" only, allowing ":" in values (e.g. URLs)
    const separatorIndex = pair.indexOf(":");
    if (separatorIndex > -1) {
      const k = pair.substring(0, separatorIndex).trim();
      const v = pair.substring(separatorIndex + 1).trim();
      acc[k] = v;
    }
    return acc;
  }, {});
  return Object.hasOwn(mapping, String(value)) ? mapping[String(value)] : value;
});

/*
  subscript
  Example:
  {'test1'|subscript}
  outputs: test₁
*/
filters.add("subscript", function (value) {
  let s = value;
  value.match(/\d/gm).forEach((num) => {
    // We'll use unicode chars because html might not be allowed.
    // subscript chars is in order in unicode table
    s = s.replace(num, String.fromCodePoint("0x208" + num));
  });
  return s;
});

/*
  superscript
  Example:
  {'test1'|superscript}
  outputs: test¹
*/
filters.add("superscript", function (value) {
  // We'll use unicode chars because html might not be allowed.
  // superscript chars is not in order so we specify these here.
  const sup = [
    "\u2070",
    "\u00B9",
    "\u00B2",
    "\u00B3",
    "\u2074",
    "\u2075",
    "\u2076",
    "\u2077",
    "\u2078",
    "\u2079",
  ];
  let s = value;
  value.match(/\d/gm).forEach((num) => {
    s = s.replace(num, sup[num]);
  });
  return s;
});

/*
  toUpper
  Example:
  {'testing'|toUpper}
  outputs: TESTING
*/
filters.add("toUpper", function (value) {
  return value.toUpperCase();
});

/*
  toLower
  Example:
  {'TESTING'|toLower}
  outputs: testing
*/
filters.add("toLower", function (value) {
  return value.toLowerCase();
});

/*
  capitalize
  Example:
  {'testing'|capitalize}
  outputs: Testing
*/
filters.add("capitalize", function (value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
});

/*
  substr
  Example:
  {'abcdef'|substr(2,4)}
  outputs: cdef
*/
filters.add("substr", function (value, i1, i2) {
  return value.substr(i1, i2);
});

/*
  substring
  Example:
  {'abcdef'|substring(2,4)}
  outputs: cd
*/
filters.add("substring", function (value, i1, i2) {
  return value.substring(i1, i2);
});

/*
  left
  Example:
  {'probably_useful'|left('_')}
  outputs: probably
*/
filters.add("left", function (value, searchFor) {
  return value.split(searchFor)[0];
});

/*
  right
  Example:
  {'probably_useful'|right('_')}
  outputs: useful
*/
filters.add("right", function (value, searchFor) {
  const i = value.indexOf(searchFor);
  return i > -1 ? value.substring(i + searchFor.length, value.length) : value;
});

/*
  truncate(length, suffix = '…')
  Cuts values longer than length and appends the suffix.
  A custom suffix such as '…' needs useNewPlaceholderMatching. '...' works
  everywhere except in Fir.
  Example:
  {'Lorem ipsum dolor sit amet'|truncate(20)}
  outputs: Lorem ipsum dolor si…
  {'Lorem ipsum dolor sit amet'|truncate(20, '...')}
  outputs: Lorem ipsum dolor si...
*/
filters.add("truncate", truncate);

/*
  split(separator, index = 0)
  Splits on a literal string (not a RegExp, unlike replace) and returns the
  part at index, counting from 0. A negative index counts from the end and must
  be quoted. Out of range gives an empty string, so it chains with default.
  Separators such as '/' need useNewPlaceholderMatching. '|' can't be used,
  as it separates the filters.
  Example:
  {'a.b.c'|split('.', 1)}
  outputs: b
  {'a.b.c'|split('.', '-1')}
  outputs: c
  {'a.b.c'|split('.')}
  outputs: a
*/
filters.add("split", split);

/*
  trim
  Example:
  {'   padded string  '|trim}
  outputs: 'padded string'
*/
filters.add("trim", function (value) {
  return value.trim();
});

/*
  toProjection
  Example:
  {'166198.59821362677'|toProjection('x','xproperty', 'yproperty','EPSG:4326', 4)}
  outputs: 12.2675 with 4 decimals.. 
*/
filters.add(
  "toProjection",
  function (value, xOrY, xProp, yProp, targetProjection, numDecimals = 4) {
    // This is a bit awkward as you need to specify both x and y to get one value.
    // Not fully straight forward...
    const transformer = new HajkTransformer({
      projection: AppModel.map.getView().getProjection().getCode(),
    });

    if (isNaN(value)) {
      throw new Error("Value should be a number");
    } else if (!xOrY) {
      throw new Error("Is it 'x' or 'y' you want? Provide as argument.");
    } else if (!xProp || !yProp) {
      throw new Error("Please provide both xProp and yProp");
    } else if (!targetProjection) {
      throw new Error("A target projection is required");
    }

    const coordinates = transformer.getCoordinatesWithProjection(
      Number(this.properties[xProp]),
      Number(this.properties[yProp]),
      targetProjection,
      numDecimals
    );
    return coordinates[xOrY.toLowerCase()];
  }
);

export default filters;
