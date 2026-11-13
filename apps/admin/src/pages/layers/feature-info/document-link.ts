/**
 * `{attribute@@documenthandler}` hands the attribute's value to the client's
 * document handler, which expects it to hold an `<a>` tag with one of the
 * data attributes below (DocumentWindowBase.handleInfoClickRequest and
 * CustomLink in the client).
 */
export const DOCUMENT_HANDLER_PLUGIN = "documenthandler";

export const KNOWN_PLUGINS = [DOCUMENT_HANDLER_PLUGIN];

export type DocumentLink =
  | { kind: "document"; text: string; document: string; header?: string }
  | { kind: "map"; text: string; target: string }
  | { kind: "external"; text: string; target: string }
  | { kind: "hover"; text: string; target: string }
  | { kind: "empty" }
  | { kind: "invalid" };

/** An example value for the preview's made-up data. */
export const EXAMPLE_DOCUMENT_LINK =
  '<a data-document="exempeldokument">Exempeldokument</a>';

/** Reads a value the way the client's document handler does. */
export function parseDocumentLink(value: unknown): DocumentLink {
  if (typeof value !== "string" || !value.includes("<")) return { kind: "invalid" };
  const parsed = new DOMParser().parseFromString(
    value.replace(/\\/g, ""),
    "text/html",
  );
  const anchor = parsed.body.getElementsByTagName("a")[0];
  if (!anchor) return { kind: "invalid" };

  const text = anchor.textContent ?? "";
  const data = (name: string) => anchor.getAttribute(name) ?? "";

  if (data("data-document")) {
    return {
      kind: "document",
      text,
      document: data("data-document"),
      header: data("data-header-identifier") || undefined,
    };
  }
  if (data("data-maplink")) return { kind: "map", text, target: data("data-maplink") };
  if (data("data-link")) return { kind: "external", text, target: data("data-link") };
  if (data("data-hover")) return { kind: "hover", text, target: data("data-hover") };
  return { kind: "empty" };
}

/**
 * A value the document handler can turn into a link: an `<a>` with
 * `data-document`, `data-link`, `data-maplink` or `data-hover`. A bare `<a>`
 * renders nothing in the map, so it does not count.
 */
export function isDocumentLinkValue(value: unknown): boolean {
  switch (parseDocumentLink(value).kind) {
    case "document":
    case "map":
    case "external":
    case "hover":
      return true;
    default:
      return false;
  }
}

/**
 * Columns whose value in this feature is a document link. An empty value is
 * not a link, so the attribute stays with the ordinary values.
 */
export function documentLinkAttributeNames(
  properties: Record<string, unknown> | undefined,
): Set<string> {
  const links = new Set<string>();
  for (const [name, value] of Object.entries(properties ?? {})) {
    if (isDocumentLinkValue(value)) links.add(name);
  }
  return links;
}
