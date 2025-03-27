export function encodeCommas(string) {
  return !string ? string : string.replace(/,/g, "%2C");
}

export function decodeCommas(string) {
  return !string ? string : string.replace(/%2C/g, ",");
}
