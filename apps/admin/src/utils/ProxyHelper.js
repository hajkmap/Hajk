export function prepareProxyUrl(url, url_proxy) {
  // Config can contain both absolute (starting with "http[s]://")
  // and relative paths. We must take care of both, if needed transform
  // to absolute URL so we can make a request.
  function makeUrlAbsolute(path = "") {
    return path.indexOf("://") !== -1 ? path : window.location.origin + path;
  }

  // If "url_proxy" is sat in config, use it. Else just go on with
  // regular request.
  return url_proxy
    ? makeUrlAbsolute(url_proxy) +
        "/" +
        makeUrlAbsolute(url).replace(/http[s]?:\/\//, "")
    : makeUrlAbsolute(url);
}
