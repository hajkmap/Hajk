class PropFilters {
  constructor() {
    this.filters = {};
    return this;
  }

  applyFilters(properties, input) {
    let args = input.split("|");
    const key = args.shift().trim();

    let value = null;

    if (key.indexOf("'") === 0) {
      // handle raw data, not from props. Can be good to have, especially when testing.
      // example: {'2021-06-03T13:04:12Z'|date}
      value = key.substring(1, key.length - 1);
    } else {
      value = properties[key];
      if (!value) {
        value = "";
      }
    }

    args.forEach((inFilter) => {
      // This is where we handle chained filters.
      const argsStart = inFilter.indexOf("(");
      let filterName = inFilter;
      let args = [];

      if (argsStart > -1) {
        filterName = inFilter.substr(0, argsStart);
        args = inFilter
          .substring(argsStart + 1, inFilter.indexOf(")"))
          .split(",");
        args.forEach((v, i, a) => {
          a[i] = this.cleanString(v.trim());
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

  cleanString(s) {
    // Free the strings contained inside ''
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
  {'45.32465456'|roundToDecimals(2)}
  outputs: 45,32
*/
filters.add("roundToDecimals", function (value, numDecimals) {
  if (isNaN(value) || isNaN(numDecimals)) {
    throw new Error("Arguments should be numbers");
  }
  return parseFloat(value.toFixed(parseInt(numDecimals))).toLocaleString();
});

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
  {10.3|lt(11, 'LessThan', 'GreaterThan')}
  outputs: 'LessThan'
  {10.3|lt(11, '', 'GreaterThan')}
  outputs: 10.3
*/
filters.add("lt", function (value, test, lessValue, greaterValue) {
  if (isNaN(value) || isNaN(test)) {
    return value;
  }
  const val = typeof value === "string" ? parseFloat(value) : value;
  const t = typeof test === "string" ? parseFloat(test) : test;

  if (val < t) {
    return typeof lessValue === "string" && lessValue.length === 0
      ? value
      : lessValue;
  } else {
    return typeof greaterValue === "string" && greaterValue.length === 0
      ? value
      : greaterValue;
  }
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
  datetime
  Example:
  {'2021-06-03T13:04:12Z'|datetime}
  outputs: 2021-06-03 13:04:12
*/
filters.add("datetime", function (value) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString();
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
  return date.toLocaleDateString();
});

/*
  time
  Example:
  {'2021-06-03T13:04:12Z'|time}
  outputs: 13:04:12
*/
filters.add("time", function (value) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString();
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
  formatNumber
  Example:
  {'98000'|formatNumber}
  outputs: 98 000
*/
filters.add("formatNumber", function (value) {
  if (isNaN(value)) {
    throw new Error("Argument should be a number");
  }
  return Number(value).toLocaleString();
});

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
  left
  Example:
  {'probably_useful'|right('_')}
  outputs: useful
*/
filters.add("right", function (value, searchFor) {
  const i = value.indexOf(searchFor);
  return i > -1 ? value.substring(i + searchFor.length, value.length) : value;
});

/*
  trim
  Example:
  {'   padded string  '|trim}
  outputs: 'padded string'
*/
filters.add("trim", function (value) {
  return value.trim();
});

export default filters;
