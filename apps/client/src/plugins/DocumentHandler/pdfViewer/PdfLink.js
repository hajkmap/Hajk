import { pdfjs } from "react-pdf";

/* ---------- 1. Extract all external links in the PDF ---------- */
export async function collectLinks(file) {
  const loadingTask = pdfjs.getDocument(file);
  const pdf = await loadingTask.promise;

  const linksPerPage = {};

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const annots = await page.getAnnotations({ intent: "display" });

    linksPerPage[pageNo] = annots
      .filter((a) => a.subtype === "Link" && a.url)
      .map((a) => a.url);
  }
  return linksPerPage;
}

/* ---------- 2. What is considered an internal domain? ---------- */
const INTERNAL_HOSTS = [
  window.location.hostname,
  // add more internal domains if needed
];

/* ---------- 3. Determine target for a given URL ---------- */
export function targetFor(url) {
  try {
    const { hostname } = new URL(url, window.location.href);
    const isInternal = INTERNAL_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`)
    );
    return isInternal ? "_self" : "_blank";
  } catch {
    return "_blank";
  }
}

/* ---------- 4. Apply policy to all <a> elements in a root ---------- */
export function applyTargetPolicy(root) {
  root.querySelectorAll("a[href]").forEach((a) => {
    const tgt = targetFor(a.href);
    a.setAttribute("target", tgt);
    if (tgt === "_blank") {
      a.setAttribute("rel", "noopener noreferrer");
    }
  });
}

/* ---------- 5. Observe future links as well ---------- */
export function observeLinks(root) {
  applyTargetPolicy(root); // run immediately

  const mo = new MutationObserver(() => applyTargetPolicy(root));
  mo.observe(root, { childList: true, subtree: true });

  // return a teardown function so you can clean up in useEffect's cleanup
  return () => mo.disconnect();
}
