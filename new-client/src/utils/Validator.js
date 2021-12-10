export const isValidLayerId = (id) => {
  return (
    !Number.isNaN(Number(id)) || // A Hajk layer is considered valid if it's ID is either a Number…
    /^[a-f0-9]{32}$/i.test(id) || // … or a MD5 string (default in the first versions of NodeJS backend)…
    /^[a-z0-9]{6}$/i.test(id) // … or a 6 characters long alphanumeric string (default in current version of NodeJS backend)
  );
};
