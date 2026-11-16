/**
 * A request to an OGC service: its url with these parameters set. The other
 * parameters the url has (a QGIS Server MAP, say) are kept, and a url that
 * ends in "?" works like one without it. OGC parameter names are not case
 * sensitive, so SERVICE takes the place of a service the url already has.
 */
export function serviceRequestUrl(
  baseUrl: string,
  params: Record<string, string>,
): string {
  const url = new URL(baseUrl, window.location.href);
  for (const [name, value] of Object.entries(params)) {
    for (const existing of [...url.searchParams.keys()]) {
      if (existing.toLowerCase() === name.toLowerCase()) {
        url.searchParams.delete(existing);
      }
    }
    url.searchParams.set(name, value);
  }
  return url.toString();
}
