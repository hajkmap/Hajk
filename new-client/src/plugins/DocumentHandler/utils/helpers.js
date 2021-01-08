export const splitAndTrimOnCommas = (searchString) => {
  return searchString.split(",").map((string) => {
    return string.trim();
  });
};

export const getStringArray = (searchString) => {
  let tempStringArray = splitAndTrimOnCommas(searchString);
  return tempStringArray.join(" ").split(" ");
};
