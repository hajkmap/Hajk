/**
 * A request to an OGC service: its url with these parameters set. Parameters
 * the url already has (a QGIS Server MAP, say) are kept, and a url that ends
 * in "?" works like one without it.
 */
export function serviceRequestUrl(
  baseUrl: string,
  params: Record<string, string>,
): string {
  const url = new URL(baseUrl, window.location.href);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  return url.toString();
}
