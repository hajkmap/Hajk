import marked from "marked";

function valueFromJson(str) {
  if (typeof str !== "string") return false;
  const jsonStart = /^\[|^\{(?!\{)/;
  const jsonEnds = {
    "[": /]$/,
    "{": /}$/,
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
  Object.keys(properties).forEach((property) => {
    var jsonData = valueFromJson(properties[property]);
    if (jsonData) {
      delete properties[property];
      properties = { ...properties, ...jsonData };
    }
  });
  return properties;
}

const getStringInformation = (s, isExternal) => {
  if (isExternal) {
    s = s.replace("{$$(", "").replace(")}", "").split(",");

    return { propertyValues: s[1].split("."), renderedByPlugin: s[0] };
  } else {
    s = s.replace("{", "").replace("}", "").split(".");
    return { propertyValues: s, renderedByPlugin: null };
  }
};

const lookup = (o, s) => {
  let propertyValue = "";
  let isExternal = s.match(/\$\$((.*?)})/g);

  const { propertyValues, renderedByPlugin } = getStringInformation(
    s,
    isExternal
  );
  console.log(propertyValues, "porpertyValues", renderedByPlugin, "renderedBy");
  switch (propertyValues.length) {
    case 1:
      propertyValue = o[propertyValues[0]] || "";
      break;
    case 2:
      propertyValue = o[propertyValues[0]][propertyValues[1]] || "";
      break;
    case 3:
      propertyValue =
        o[propertyValues[0]][propertyValues[1]][propertyValues[2]] || "";
      break;
    default:
      propertyValue = "";
  }

  if (isExternal) {
    console.log(propertyValue, "propertyValue");
    return `$$(${renderedByPlugin}|${propertyValue})`;
  } else {
    return propertyValue;
  }
};

export function mergeFeaturePropsWithMarkdown(markdown, properties) {
  console.log(markdown, "markdown");
  markdown = markdown.replace(/export:/g, "");
  if (markdown && typeof markdown === "string") {
    (markdown.match(/{(.*?)}/g) || []).forEach((property) => {
      markdown = markdown.replace(property, lookup(properties, property));
    });
  }

  let domTree = new DOMParser().parseFromString(marked(markdown), "text/html");
  let visibleSectionHtml = "";
  let hiddenSectionHtml = "";
  let sections = [...domTree.body.getElementsByTagName("section")];

  sections.forEach((section) => {
    if (section.getAttributeNames().includes("data-visible")) {
      visibleSectionHtml = section.innerHTML;
    }

    if (section.getAttributeNames().includes("data-hidden")) {
      hiddenSectionHtml = section.innerHTML;
    }
  });

  return {
    __html: marked(markdown),
    __visibleSectionHtml: marked(visibleSectionHtml),
    __hiddenSectionHtml: marked(hiddenSectionHtml),
  };
}
