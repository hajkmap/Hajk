import marked from "marked";
import ReactHtmlParser from "react-html-parser";

export default class FeaturePropsParsing {
  constructor(settings) {
    this.globalObserver = settings.globalObserver;
  }

  #valueFromJson = (str) => {
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
  };

  #isChildTextOnly = (child) => {
    return child && !child.props;
  };

  #nodeShouldBeFetchedExternal = (nextSibling) => {
    if (
      this.#isChildTextOnly(nextSibling) &&
      this.#isMarkupForExternalElement(nextSibling)
    ) {
      return true;
    }
    return false;
  };

  #hasChildren = (child) => {
    return child.props.children && child.props.children.length > 0;
  };

  extractPropertiesFromJson = (properties) => {
    Object.keys(properties).forEach((property) => {
      var jsonData = this.#valueFromJson(properties[property]);
      if (jsonData) {
        delete properties[property];
        properties = { ...properties, ...jsonData };
      }
    });
    return properties;
  };

  #createDataAttributesObjectFromEntriesArray = (entries) => {
    return entries.reduce((dataAttributeObject, entry) => {
      return {
        ...dataAttributeObject,
        ...{ [entry[0]]: this.#unescapeString(entry[1]) },
      };
    }, {});
  };

  #unescapeString = (strng) => {
    return strng.replace(/\\"/g, "");
  };

  #extractDataAttributes = (props) => {
    let entries = Object.entries(props).filter((entry) => {
      return entry[0].search("data-") !== -1;
    });
    return this.#createDataAttributesObjectFromEntriesArray(entries);
  };

  #fetchExternal = (property, externalEvent) => {
    if (
      this.globalObserver.getListeners(`core.info-click-${externalEvent}`)
        .length > 0
    )
      return new Promise((resolve, reject) => {
        let dataAttributes = this.#extractDataAttributes(property.props);
        //Let subscription resolve the promise
        this.globalObserver.publish(`core.info-click-${externalEvent}`, {
          payload: {
            type: property.type,
            children: property.props.children,
            dataAttributes: dataAttributes,
          },
          resolve: resolve,
        });
      });
    return null;
  };

  #isMarkupForExternalElement = (string) => {
    return string.match(/@@(.*?)/g);
  };

  #removeChildFromChildren = (children, index) => {
    children.splice(index, 1);
  };

  #arrayHasMoreChildren = (children, index) => {
    return children.length > index + 1;
  };

  #exchangeChildForExternalComponent = async (child, children, index) => {
    let externalEvent = children[index + 1].substr(2);
    let externalElement = await this.#fetchExternal(child, externalEvent);

    if (externalElement) {
      children[index] = externalElement;
    }
  };

  #renderHtmlAsReactComponents = async (html) => {
    const reactElementFromHtml = ReactHtmlParser(html);
    const injectIfExternalComponents = async (children) => {
      children.forEach(async (child, index) => {
        if (this.#isChildTextOnly(child)) {
          if (this.#isMarkupForExternalElement(child)) {
            this.#removeChildFromChildren(children, index);
            return;
          }
          return;
        }
        if (
          this.#arrayHasMoreChildren(children, index) &&
          this.#nodeShouldBeFetchedExternal(children[index + 1])
        ) {
          this.#exchangeChildForExternalComponent(child, children, index);

          return;
        }
        if (this.#hasChildren(child)) {
          injectIfExternalComponents(child.props.children);
        }
      });
    };
    await injectIfExternalComponents(reactElementFromHtml[0].props.children);
    return reactElementFromHtml;
  };

  #getStringInformation = (s, isExternal) => {
    if (isExternal) {
      let attributeInformation = s
        .replace("{", "")
        .replace("}", "")
        .split("@@");
      let propertyValues = attributeInformation[0].split(".");
      return {
        propertyValues: propertyValues,
        renderedByPlugin: attributeInformation[1],
      };
    } else {
      s = s.replace("{", "").replace("}", "").split(".");
      return { propertyValues: s, renderedByPlugin: null };
    }
  };

  #lookup = (o, s) => {
    let propertyValue = "";
    let isExternal = this.#isMarkupForExternalElement(s);
    const { propertyValues, renderedByPlugin } = this.#getStringInformation(
      s,
      isExternal
    );

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
      return `${propertyValue}@@${renderedByPlugin}`;
    } else {
      return propertyValue;
    }
  };

  mergeFeaturePropsWithMarkdown = async (markdown, properties) => {
    markdown = markdown.replace(/export:/g, "");
    if (markdown && typeof markdown === "string") {
      (markdown.match(/{(.*?)}/g) || []).forEach((property) => {
        markdown = markdown.replace(
          property,
          this.#lookup(properties, property)
        );
      });
    }

    let domTree = new DOMParser().parseFromString(
      marked(markdown),
      "text/html"
    );
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

    let renderedHtml = await this.#renderHtmlAsReactComponents(
      marked(markdown)
    );

    return {
      __html: renderedHtml,
      __visibleSectionHtml: marked(visibleSectionHtml),
      __hiddenSectionHtml: marked(hiddenSectionHtml),
    };
  };
}
