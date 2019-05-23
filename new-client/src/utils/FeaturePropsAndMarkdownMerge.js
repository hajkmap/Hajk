import marked from "marked";

export default function mergeFeaturePropsWithMarkdown(markdown, properties) {
  markdown = markdown.replace(/export:/g, "");
  if (markdown && typeof markdown === "string") {
    (markdown.match(/{(.*?)}/g) || []).forEach(property => {
      function lookup(o, s) {
        s = s
          .replace("{", "")
          .replace("}", "")
          .split(".");
        switch (s.length) {
          case 1:
            return o[s[0]] || "";
          case 2:
            return o[s[0]][s[1]] || "";
          case 3:
            return o[s[0]][s[1]][s[2]] || "";
          default:
            return "";
        }
      }

      markdown = markdown.replace(property, lookup(properties, property));
    });
  }
  return {
    __html: marked(markdown)
  };
}
