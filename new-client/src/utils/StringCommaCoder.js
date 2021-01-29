export function encodeCommas(string) {
  return !string ? string : string.replaceAll(",", "%2C");
}

export function decodeCommas(string) {
  return !string ? string : string.replaceAll("%2C", ",");
}
