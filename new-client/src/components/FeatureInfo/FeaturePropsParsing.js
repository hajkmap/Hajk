import React from "react";
// import ReactDOM, { render } from "react-dom";
import { renderToString } from "react-dom/server";
import {
  Divider,
  Link,
  Paper,
  Table,
  TableBody,
  // TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import marked from "marked";
import ReactHtmlParser from "react-html-parser";

export default class FeaturePropsParsing {
  constructor(settings) {
    this.globalObserver = settings.globalObserver;

    // Prepare an object that holds our overrides for the different
    // Marked types, see https://marked.js.org/using_pro#renderer for a complete list.
    const renderer = {
      table(header, body) {
        console.log("TABLE header FROM TR: ", header);
        console.log("TABLE body FROM TR: ", body);

        return renderToString(
          <TableContainer component={Paper}>
            <Table>
              <TableHead dangerouslySetInnerHTML={{ __html: header }} />
              <TableBody dangerouslySetInnerHTML={{ __html: body }} />
            </Table>
          </TableContainer>
        );
      },
      tablerow(content) {
        console.log("TABLEROW content from TD:", content);
        return renderToString(
          <TableRow dangerouslySetInnerHTML={{ __html: content }} />
        );
      },
      tablecell(content, flags) {
        console.log("TABLECELL inner content:", content);

        // FIXME: Problem 1: We can't use TableCell here as it throws an error from MUI. Why?!
        return `<td align="${flags.align || ""}">${content}</td>`;
        // return renderToString(
        //   <TableCell
        //     align={flags.align}
        //     variant={flags.header === true ? "head" : "body"}
        //     dangerouslySetInnerHTML={{ __html: content }}
        //   />
        // );
      },
      heading(text, level) {
        return renderToString(
          <Typography variant={`h${level}`}>{text}</Typography>
        );
      },
      hr() {
        return renderToString(<Divider />);
      },
      link(href, title, text) {
        return renderToString(
          <Link href={href} title={title}>
            {text}
          </Link>
        );
      },
    };

    // FIXME: Problem 2: All MUI components rendered from Marked are rendered
    // outside our ThemeProvider, hence we don't get the correct colors.
    marked.use({ renderer });
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

  #nodeShouldBeFetchedExternally = (nextSibling) => {
    return (
      this.#isChildTextOnly(nextSibling) &&
      this.#isMarkupForExternalElement(nextSibling)
    );
  };

  #hasChildren = (child) => {
    return child?.props?.children && child.props.children.length > 0
      ? true
      : false;
  };

  /**
   * Converts a JSON-string of properties into a properties object
   * @param {str} properties
   * @returns {object}
   */
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

  #unescapeString = (string) => {
    return string.replace(/\\"/g, "");
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
      return new Promise((resolve) => {
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
          this.#nodeShouldBeFetchedExternally(children[index + 1])
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

  #getAttributePlaceholderInformation = (attributePlaceholder, isExternal) => {
    if (isExternal) {
      let attributeInformation = attributePlaceholder.split("@@");
      let placeholder = attributeInformation[0].split(".");
      let pluginToUseForRenderAttribute = attributeInformation[1];
      return {
        placeholder: placeholder,
        renderWithPlugin: pluginToUseForRenderAttribute,
      };
    }
    return {
      placeholder: attributePlaceholder.split("."),
      renderWithPlugin: null,
    };
  };

  #getPropertyForPlaceholder = (
    properties,
    attributePlaceholder,
    isExternal
  ) => {
    let propertyValue = "";

    const {
      placeholder,
      renderWithPlugin,
    } = this.#getAttributePlaceholderInformation(
      attributePlaceholder,
      isExternal
    );

    switch (placeholder.length) {
      case 1:
        propertyValue = properties[placeholder[0]] || "";
        break;
      case 2:
        propertyValue = properties[placeholder[0]][placeholder[1]] || "";
        break;
      case 3:
        propertyValue =
          properties[placeholder[0]][placeholder[1]][placeholder[2]] || "";
        break;
      default:
        propertyValue = "";
    }

    if (isExternal) {
      return `${propertyValue}@@${renderWithPlugin}`;
    } else {
      return propertyValue;
    }
  };

  /**
   * Used markdown and matches it to the properties.
   * The markdown is used as a template and we inject the correct properties
   * at specified placeholders. The method is returning featureInformation as React elements
   *
   * @param {str} properties
   * @returns {object}
   */
  mergeFeaturePropsWithMarkdown = async (markdown, properties) => {
    markdown = markdown.replace(/export:/g, "");
    if (markdown && typeof markdown === "string") {
      (markdown.match(/{(.*?)}/g) || []).forEach((property) => {
        let propertyIsExternal = this.#isMarkupForExternalElement(property);
        let attributePlaceholder = property.replace("{", "").replace("}", "");
        markdown = markdown.replace(
          property,
          this.#getPropertyForPlaceholder(
            properties,
            attributePlaceholder,
            propertyIsExternal
          )
        );
      });
    }

    let html = `<div id="wrapper">${marked(markdown)}</div>`;
    return await this.#renderHtmlAsReactComponents(html);
  };
}
