export const isValidLayerId = (id) => {
  return (
    // … or a 6 characters long alphanumeric string (which is the new default for layers created in NodeJS backend)
    !Number.isNaN(Number(id)) || // … and the name is either a Number…
    /^[a-f0-9]{32}$/i.test(id) || // … or an MD5 string (which was used in the NodeJS backend)
    /^[a-z0-9]{6}$/i.test(id)
  );
};
