import type { ExtraProps } from "react-markdown";

// react-markdown's types give us the hast types, without a direct dependency on hast.
type Element = NonNullable<ExtraProps["node"]>;
type Child = Element["children"][number];
type Parent = { children: Child[] };

const CAROUSEL_CLASS = "hajk-carousel";

// Elements that can't be put inside a <p>, so they are left as they are in captions.
const BLOCK_ELEMENTS = new Set(
  "blockquote details div dl figure h1 h2 h3 h4 h5 h6 hr ol p pre section style table ul".split(
    " "
  )
);

const isElement = (node: Child): node is Element => node.type === "element";

const isBlock = (node: Child) =>
  isElement(node) && BLOCK_ELEMENTS.has(node.tagName);

const isBlank = (node: Child) =>
  node.type === "text"
    ? node.value.trim() === ""
    : node.type === "comment" || (isElement(node) && node.tagName === "br");

const isCarousel = (node: Element) => {
  const { className } = node.properties;
  return (
    node.tagName === "div" &&
    Array.isArray(className) &&
    className.includes(CAROUSEL_CLASS)
  );
};

const createElement = (
  tagName: string,
  children: Element["children"],
  properties: Element["properties"] = {}
): Element => ({ type: "element", tagName, properties, children });

const getImages = (node: Child): Element[] => {
  if (!isElement(node)) return [];
  return node.tagName === "img" ? [node] : node.children.flatMap(getImages);
};

const getImageUrls = (node: Child): string[] =>
  getImages(node)
    .map(({ properties }) => String(properties.src ?? "").trim())
    .filter((src) => src !== "");

// Wraps each run of inline nodes in a <p>, so that the "p" override in
// FeaturePropsParsing is applied. Runs without content are dropped.
const wrapInline = (nodes: Child[]): Child[] => {
  const result: Child[] = [];
  let run: Child[] = [];

  const flush = () => {
    while (run.length > 0 && isBlank(run[0])) run.shift();
    while (run.length > 0 && isBlank(run[run.length - 1])) run.pop();
    if (run.length > 0) result.push(createElement("p", run));
    run = [];
  };

  nodes.forEach((node) => {
    if (isBlock(node)) {
      flush();
      result.push(node);
    } else {
      run.push(node);
    }
  });
  flush();

  return result;
};

const createCarousel = (node: Element, dataKey: string): Child[] => {
  const before: Child[] = [];
  const slides: { image: Element; caption: Child[] }[] = [];

  node.children
    // Images on consecutive lines end up in one paragraph, unwrap it. Other
    // paragraphs are kept, so that the caption's paragraphs aren't merged.
    .flatMap((child) =>
      isElement(child) && child.tagName === "p" && getImages(child).length > 0
        ? child.children
        : [child]
    )
    .forEach((child) => {
      if (isElement(child) && getImages(child).length > 0) {
        slides.push({ image: child, caption: [] });
      } else {
        (slides.at(-1)?.caption ?? before).push(child);
      }
    });

  // An image without URL, e.g. because the attribute is empty, is dropped with its caption.
  const visibleSlides = slides.filter(
    ({ image }) => getImageUrls(image).length > 0
  );

  if (visibleSlides.length === 0) return wrapInline(before);

  return [
    ...wrapInline(before),
    createElement(
      CAROUSEL_CLASS,
      visibleSlides.map(({ image, caption }) =>
        createElement("div", [image, ...wrapInline(caption)], {
          className: [`${CAROUSEL_CLASS}-slide`],
        })
      ),
      { dataKey }
    ),
  ];
};

const transform = (parent: Parent, dataKey: string) => {
  parent.children = parent.children.flatMap((child) => {
    if (!isElement(child)) return [child];
    if (isCarousel(child)) return createCarousel(child, dataKey);
    transform(child, dataKey);
    return [child];
  });
};

/**
 * Rehype plugin that turns each div.hajk-carousel (see FeaturePropsParsing)
 * into a <hajk-carousel> element with one child element per slide. Must be run
 * after rehypeRaw. The element is rendered by ImageCarousel.
 */
export default function rehypeCarousel() {
  // The Markdown text (with values filled in) is the key, as it differs between
  // features even if they happen to have the same images.
  return (tree: Parent, file: { toString(): string }) =>
    transform(tree, file.toString());
}
