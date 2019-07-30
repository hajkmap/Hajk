import marked from "marked";

function valueFromJson(str) {
  if (typeof str !== "string") return false;
  const jsonStart = /^\[|^\{(?!\{)/;
  const jsonEnds = {
    "[": /]$/,
    "{": /}$/
  };
  const start = str.match(jsonStart);
  const jsonLike = start && jsonEnds[start[0]].test(str);
  var result = false;

  if (jsonLike) {
    try {
      result = JSON.parse(str);
    } catch (ex) {
      result = false;
    }
  } else {
    result = false;
  }

  return result;
}

export function extractPropertiesFromJson(properties) {
  Object.keys(properties).forEach(property => {
    var jsonData = valueFromJson(properties[property]);
    if (jsonData) {
      delete properties[property];
      properties = { ...properties, ...jsonData };
    }
  });
  return properties;
}

export function mergeFeaturePropsWithMarkdown(markdown, properties) {
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
