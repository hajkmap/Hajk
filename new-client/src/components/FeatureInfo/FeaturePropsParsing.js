import React from "react";
import ReactMarkdown from "react-markdown";
import { withStyles } from "@material-ui/core";
import gfm from "remark-gfm";
import {
  Divider,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";

const StyledTableRow = withStyles((theme) => ({
  root: {
    "&:nth-of-type(even)": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

export default class FeaturePropsParsing {
  constructor(settings) {
    this.globalObserver = settings.globalObserver;
    this.options = settings.options;
    this.asyncComponentsPromises = [];
    this.resolvedPromises = [];

    this.markdown = null;
    this.properties = null;

    // Default to true to ensure backwards compatibility with old configs that predominately use HTML
    this.allowDangerousHtml = this.options.allowDangerousHtml ?? true;

    this.renderers = {
      // root: (a, b, c) => {
      //   console.log("root: ", a, b, c);
      //   return a.children;
      // },
      text: (text) => {
        // This helper is passed to ReactMarkdown at render. At this stage,
        // we expect that the only remaining {stuff} will contain digits, and
        // that those numbers represent element index in this.asyncComponentsPromises.
        // So we want to replace all of them with the corresponding component from promises.
        const match = text.value.match(/{(\d+)}/);
        console.log("match: ", match);
        if (match) {
          console.log("Text node that includes digit", text);
          console.log(
            "Returning this resolved promise",
            this.resolvedPromises[match[1]]
          );
          return this.resolvedPromises[match[1]];
        } else return text.children;
      },
      thematicBreak: () => <Divider />,
      link: (a) => {
        return <Link href={a.href}>{a.children}</Link>;
      },
      heading: ({ level, children }) => {
        return <Typography variant={`h${level}`}>{children}</Typography>;
      },
      table: (a) => {
        return (
          <TableContainer component="div">
            <Table size="small">{a.children}</Table>
          </TableContainer>
        );
      },
      tableHead: (a) => {
        return <TableHead>{a.children}</TableHead>;
      },
      tableBody: (a) => {
        return <TableBody>{a.children}</TableBody>;
      },
      tableRow: (a) => {
        return <StyledTableRow>{a.children}</StyledTableRow>;
      },
      tableCell: (a) => {
        return <TableCell align={a.align || "inherit"}>{a.children}</TableCell>;
      },
    };
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

  #getPropertyForPlaceholder = (property, properties) => {
    let returnValue = null;
    // Strip the curly brackets
    property = property.substring(1, property.length - 1);

    // Properties to be fetch from external components will include "@@".
    // Side note: /(?<!@)@@(?!@)/ would be a nice solution to only match those
    // with exactly 2 at signs. But at time of writing the browser support for
    // negative lookbehind wasn't there, so I opted with this less elegant solution:
    if (property.includes("@@") && !property.includes("@@@")) {
      const [propertyName, pluginName] = property.split("@@");
      console.log("Will look for propertyName: ", propertyName);
      console.log("In these properties: ", properties);

      // Grab the value from the properties collections
      const propertyValue = properties[propertyName];
      // If they key was not found in the properties object, or the value is empty, we can't go on.
      if (
        propertyValue === undefined ||
        propertyValue === null ||
        propertyValue.trim() === ""
      )
        return "";
      console.log("Extracted propertyValue: ", propertyValue);

      // Add a new Promise (which is the return value from #fetchExternal) to our
      // array of Promises.
      this.asyncComponentsPromises.push(
        this.#fetchExternal(propertyValue, pluginName)
      );

      // Don't get the value just yet - we want to keep this within "{}" at this stage!
      // Return the ID of this element in the array
      returnValue = `{${this.asyncComponentsPromises.length - 1}}`;
    } else {
      // Grab the actual value from the Properties collection, if not found, fallback to empty string
      returnValue = properties[property] || "";
    }

    console.log("returnValue: ", returnValue);
    return returnValue;
  };

  #fetchExternal = (property, externalEvent) => {
    console.log(
      "fetchExternal: property, externalEvent ",
      property,
      externalEvent
    );
    if (
      this.globalObserver.getListeners(`core.info-click-${externalEvent}`)
        .length > 0
    ) {
      return new Promise((resolve, reject) => {
        //Let subscription resolve the promise
        this.globalObserver.publish(`core.info-click-${externalEvent}`, {
          payload: property,
          resolve,
          reject,
        });
      });
    }
    return null;
  };

  #conditionalReplacer = (...args) => {
    // Extract the regex named capture groups, they will be the last argument
    // when .replace() calls this helper.
    // Expect matched to contain 'condition', 'attributes' and 'content'.
    const matched = args[args.length - 1];

    // Do different things, depending on 'condition'
    switch (matched.condition) {
      case "if":
        // Append a new line to the content that (perhaps)
        // will be returned. If we return a content, we must
        // ensure that new line is added, because we stripped
        // all ending new lines (after </if>) in the regex.
        matched.content += "\n";

        // Handle <if foo="bar"> or <if foo=bar>
        if (matched.attributes?.includes("=")) {
          // Turn "FOO=\"BAR\"" into k = "FOO" and v = "BAR"
          let [k, v] = matched.attributes
            .split("=") // Create an array
            .map((e) => e.replaceAll('"', "").trim()); // Remove double quotes and whitespace

          // Using truthy equal below, we want 2 and "2" to be seen as equal.
          // eslint-disable-next-line eqeqeq
          if (k == v) {
            return matched.content;
          } else {
            return "";
          }
        }
        // Handle <if foo> - if it exits, evaluate to true and show content
        else if (matched.attributes?.trim().length > 0) {
          return matched.content;
        }
        // Handle <if > (i.e. do not render because the attribute to evaluate is falsy)
        else {
          return "";
        }
      // For any other condition, leave as-is (could be HTML tag)
      default:
        return args[0];
    }
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

  setMarkdownAndProperties({ markdown, properties }) {
    this.markdown = markdown;
    this.properties = properties;
    return this;
  }

  /**
   * @summary Use Markdown from settings, apply conditional rendering and
   * values from properties, and return a React component.
   *
   * @description There are three things going on here:
   * 1. The markdown is used as a template, anything between { and } gets replaced
   * with the real value from properties object, or is left empty.
   * 2. Next we apply conditional rendering (where statements are between < and >).
   * Currently, if-condition is the only one supported, but more might become available.
   * Depending on the condition value, replacing can occur within our markdown string.
   * 3. The final markdown string is passed to the ReactMarkdown component.
   *
   * @param {str} markdown
   * @param {object} properties
   * @returns {object} ReactMarkdown component
   */
  mergeFeaturePropsWithMarkdown = async () => {
    console.log("MARKDOWN, pre property value replace", this.markdown);
    // "markdown" will now contain placeholders for our value that we get
    // from features. They'll be between { and }.
    // Lets' extract them and replace with value from "properties".
    if (this.markdown && typeof this.markdown === "string") {
      (this.markdown.match(/{(.*?)}/g) || []).forEach((property) => {
        // property comes in as {intern_url_1@@documenthandler} or {foobar}

        // const propertyIsExternal = this.#isMarkupForExternalElement(property);
        // const attributePlaceholder = property.replace("{", "").replace("}", "");

        // Let's replace all occurrences of the property with:
        // {foobar} -> Some nice FoobarValue
        // {intern_url_1@@documenthandler} -> {n} // n is element index in the array that will hold Promises from external components
        this.markdown = this.markdown.replace(
          property,
          this.#getPropertyForPlaceholder(property, this.properties)
        );
      });
      console.log("MARKDOWN, pre conditional replace", this.markdown);

      // Find all "conditional tags" (i.e. <if foo="bar">baz</if>) and apply the replacer function on
      // all matches.
      // The regex string below does the following:
      // Split each match into 3 named capture groups:
      // - "condition": the word between < and whitespace, "if" in this example
      // - "attributes": whatever follows the condition, until we see a >, 'foo="bar"'
      // - "content": anything after > but before </ and whatever was the result in group one, "Baz"
      // Note that we include any ending new lines in the match. That's because _if_ we find a match
      // and will remove it, we must remove the line ending too, otherwise we would break the Markdown
      // formatting if only certain strings were to be removed, but all line endings would remain.
      this.markdown = this.markdown.replace(
        /<(?<condition>\w+)[\s/]?(?<attributes>[^>]+)?>(?<content>[^<]+)?(?:<\/\1>\n*)?/gi,
        this.#conditionalReplacer
      );
      console.log("MARKDOWN, final", this.markdown);
      this.resolvedPromises = await Promise.all(this.asyncComponentsPromises);
    }

    return (
      <ReactMarkdown
        plugins={[gfm]} // GitHub Formatted Markdown adds support for Tables in MD
        allowDangerousHtml={this.allowDangerousHtml}
        renderers={this.renderers} // Custom renderers, see definition in this.renderers
        children={this.markdown} // Our MD, as a text string
      />
    );
  };
}
