export const isValidLayerId = (id) => {
  return (
    !Number.isNaN(Number(id)) || // A Hajk layer is considered valid if it's ID is either a Number…
    /^[a-f0-9]{32}$/i.test(id) || // … or a MD5 string (default in the first versions of NodeJS backend)…
    /^[a-z0-9]{6}$/i.test(id) // … or a 6 characters long alphanumeric string (default in current version of NodeJS backend)
  );
};

/**
 * @summary Use the built-in URL constructor and try/catch to see if the
 * provided argument is a valid URL.
 * @description The clever use of try/catch makes it possible to supply
 * argument of any type, including Array, objects, undefined, etc. Syntax
 * error will be caught and false returned in those cases.
 * @param {any} urlString
 * @returns {boolean} True if URL constructor created a URL instance, false otherwise
 */
export const isValidUrl = (urlString) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};
