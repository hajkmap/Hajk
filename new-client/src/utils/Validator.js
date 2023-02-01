export const isValidLayerId = (id) => {
  return (
    // … or a 6 characters long alphanumeric string (which is the new default for layers created in NodeJS backend)
    !Number.isNaN(Number(id)) || // … and the name is either a Number…
    /^[a-f0-9]{32}$/i.test(id) || // … or an MD5 string (which was used in the NodeJS backend)
    /^[a-z0-9]{6}$/i.test(id)
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
