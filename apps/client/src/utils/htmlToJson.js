// Convert an HTML string into a lightweight JSON DOM compatible with existing rendering.
// Output structure mirrors the legacy html2json shape used by Page.jsx:
// - Root: { node: 'root', child: [...] }
// - Element: { node: 'element', tag: 'div' | 'p' | ..., attr: { ... }, child: [...] }
// - Text: { node: 'text', text: '...' }

// Note that this utility, except for this comment, was generated entirely by AI
// and aims at replacing the html2json package. The Collector plugin, where this is used,
// is not the most widely used plugin, so it's a bit of a challenge to test it properly.
// /JW, 2026-01-28

export function htmlToJson(htmlString) {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // Fallback for non-browser environments (should not occur in client)
    return { node: "root", child: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString || "", "text/html");
  const rootChildren = [];
  doc.body.childNodes.forEach((child) => {
    const jsonNode = toJsonNode(child);
    if (jsonNode) {
      rootChildren.push(jsonNode);
    }
  });

  return { node: "root", child: rootChildren };
}

function toJsonNode(node) {
  switch (node.nodeType) {
    case Node.ELEMENT_NODE: {
      const tag = node.tagName.toLowerCase();
      const attr = {};
      if (node.attributes && node.attributes.length > 0) {
        for (let i = 0; i < node.attributes.length; i++) {
          const a = node.attributes[i];
          attr[a.name] = a.value;
        }
      }
      const child = [];
      node.childNodes.forEach((n) => {
        const c = toJsonNode(n);
        if (c) {
          child.push(c);
        }
      });
      return { node: "element", tag, attr, child };
    }
    case Node.TEXT_NODE: {
      const text = node.nodeValue ?? "";
      // Preserve non-empty text nodes; ignore pure whitespace to reduce noise
      if (text.trim() === "") {
        return null;
      }
      return { node: "text", text };
    }
    default:
      return null;
  }
}
