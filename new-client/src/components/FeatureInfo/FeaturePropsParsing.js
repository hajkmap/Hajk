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

// Styled Component, makes every second row colored
const StyledTableRow = withStyles((theme) => ({
  root: {
    "&:nth-of-type(even)": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

const StyledTypography = withStyles((theme) => ({
  h1: {
    fontSize: "1.6rem",
    fontWeight: "500",
  },
  h2: {
    fontSize: "1.4rem",
    fontWeight: "500",
  },
  h3: {
    fontSize: "1.2rem",
    fontWeight: "500",
  },
  h4: {
    fontSize: "1rem",
    fontWeight: "500",
  },
  h5: {
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  h6: {
    fontSize: "0.875rem",
    fontWeight: "400",
    fontStyle: "italic",
  },
}))(Typography);

export default class FeaturePropsParsing {
  constructor(settings) {
    this.globalObserver = settings.globalObserver;
    this.options = settings.options;

    // Two arrays that will hold pending promises and their resolved values, respectively.
    this.pendingPromises = [];
    this.resolvedPromisesWithComponents = [];

    this.markdown = null;
    this.properties = null; // Will hold the property values from the clicked feature

    // Default to true to ensure backwards compatibility with old configs that predominately use HTML
    this.allowDangerousHtml = this.options.allowDangerousHtml ?? true;

    // Here we define the renderers used by ReactMarkdown, see https://github.com/remarkjs/react-markdown#appendix-b-node-types
    this.renderers = {
      text: (text) => {
        // This helper is passed to ReactMarkdown at render. At this stage,
        // we expect that the only remaining {stuff} will contain digits, and
        // that those numbers represent element index in this.asyncComponentsPromises.
        // So we want to replace all of them with the corresponding component from promises.
        const match = text.value.match(/{(\d+)}/);
        if (match) {
          return this.resolvedPromisesWithComponents[match[1]];
        } else return text.children;
      },
      thematicBreak: () => <Divider />,
      link: (a) => {
        return (
          <Link href={a.href} target="_blank">
            {a.children}
          </Link>
        );
      },
      heading: ({ level, children }) => {
        return (
          <StyledTypography variant={`h${level}`}>{children}</StyledTypography>
        );
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

  #getPropertyValueForPlaceholder = (placeholder) => {
    // First strip the curly brackets, e.g. {foobar} -> foobar
    placeholder = placeholder.substring(1, placeholder.length - 1);

    // Placeholders to be fetch from external components will include "@@", and
    // they need to be treated differently from "normal" placeholders (sans @@).
    if (placeholder.includes("@@") && !placeholder.includes("@@@")) {
      // Extract the property and plugins names from the placeholder.
      const [propertyName, pluginName] = placeholder.split("@@");

      // Grab the actual value of this placeholder from the properties collections
      const propertyValue = this.properties[propertyName];

      // If they key was not found in the properties object, or the value is empty, we can't go on.
      if (
        propertyValue === undefined ||
        propertyValue === null ||
        propertyValue.trim() === ""
      ) {
        return "";
      } else {
        // Now we know 1) property value of the placeholder and 2) which plugin will take care of it.
        // Next we want to call #fetchExternal, that immediately returns a Promise, and push that
        // promise into an array of promises. Later on, we will want to get the value from this
        // fulfilled promise, so one key aspect here is to keep track of which promise value should
        // go where. We will do it the easy way: when the promise is pushed into an array, push
        // returns the new array length. That means that this recently pushed element will have
        // an index of n-1. We use this fact by returning a string, "{n-1}" back to the Markdown string.
        // That way, in the final step of Markdown parsing, we will be able to replace each "{n-1}" with
        // the contents of the correct element in the resolved promises array.

        return `{${
          this.pendingPromises.push(
            this.#fetchExternal(propertyValue, pluginName)
          ) - 1
        }}`;
      }
    }
    // Just a "normal" placeholder, e.g. {foobar}
    else {
      // Grab the actual value from the Properties collection, if not found, fallback to empty string
      return this.properties[placeholder] || "";
    }
  };

  #fetchExternal = (propertyValue, pluginName) => {
    // If there are listeners for the current plugin that we parsed out here…
    if (
      this.globalObserver.getListeners(`core.info-click-${pluginName}`).length >
      0
    ) {
      return new Promise((resolve, reject) => {
        // …let's return a Promise that will publish an event to the
        // requested plugin. The listening plugin will use the payload,
        // together with resolve/reject to fulfill the Promise.
        this.globalObserver.publish(`core.info-click-${pluginName}`, {
          payload: propertyValue,
          resolve,
          reject,
        });
      });
    } else {
      return null;
    }
  };
  /**
   * @summary The evaluator helper used in the final stage of markdown string
   * parsing. Extracts <if> tags and either keeps the content (if value evaluates)
   * to true, or removes it from the markdown string.
   *
   * @param {*} args
   * @returns {string} Value inside the <if> condition (if evaluated to true), or an empty string.
   */
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

          // Using truthy equal below: we want 2 and "2" to be seen as equal.
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
   * 2. Next we apply conditional rendering, where conditions are between {{ and }} while
   * content is between {{condition}} and {{/condition}}.
   * Currently, if-condition is the only one supported, but more might become available.
   * Depending on the condition value, replacing can occur within our markdown string.
   * 3. The final markdown string is passed to the ReactMarkdown component.
   *
   * @param {str} markdown
   * @param {object} properties
   * @returns {object} ReactMarkdown component
   */
  mergeFeaturePropsWithMarkdown = async () => {
    if (this.markdown && typeof this.markdown === "string") {
      // this.markdown is a string that contains placeholders for our future values.
      // The placeholders are surrounded by curly brackets ({ & }).
      // The regex below will match all placeholders.
      // The loop below extracts all placeholders and replaces them with actual values
      // current feature's property collection.
      // Match any word character, @ sign, dash or dot
      (this.markdown.match(/{[\w@\-.]+}/g) || []).forEach((placeholder) => {
        // placeholder is a string, e.g. "{intern_url_1@@documenthandler}" or "{foobar}"
        // Let's replace all occurrences of the placeholder like this:
        // {foobar} -> Some nice FoobarValue
        // {intern_url_1@@documenthandler} -> {n} // n is element index in the array that will hold Promises from external components
        this.markdown = this.markdown.replace(
          placeholder,
          this.#getPropertyValueForPlaceholder(placeholder)
        );
      });

      // this.markdown will now contain actual values instead of properties, OR
      // references to elements in the this.resolvedPromises array. The latter will
      // be the only remaining occurrences of numbers surrounded by curly brackets.

      // Next step is to find all "conditional tags" (i.e. {{if foo="bar"}}baz{{/if}})
      // and apply the replacer function on all matches.
      // The regex string below does the following:
      // Split each match into 3 named capture groups:
      // - "condition": the word between {{ and whitespace, "if" in this example
      // - "attributes": whatever follows the condition, until we see a }}, 'foo="bar"'
      // - "content": anything after }} but before {{/ and whatever was the result in group one, "baz"
      // Note that the match will include one line ending. That's because _if_ we find a match
      // and will remove it, we must remove the line ending too, otherwise we would break the Markdown
      // formatting if only certain strings were to be removed, but all line endings would remain.
      this.markdown = this.markdown.replace(
        /{{(?<condition>\w+)[\s/]?(?<attributes>[^}}]+)?}}(?<content>[^{{]+)?(?:{{\/\1}}\n?)/gi,
        this.#conditionalReplacer
      );

      // The final step is to await for all promises that might exist (if we fetch from
      // external components) to fulfill. We can't render before that!
      this.resolvedPromisesWithComponents = await Promise.all(
        this.pendingPromises
      );

      // Now, when promises are fulfilled, we can render. One of the render's helpers
      // will make use of the results in this.resolvedPromises, so that's why we had to wait.
      return (
        <ReactMarkdown
          plugins={[gfm]} // GitHub Formatted Markdown adds support for Tables in MD
          allowDangerousHtml={this.allowDangerousHtml}
          renderers={this.renderers} // Custom renderers, see definition in this.renderers
          children={this.markdown} // Our MD, as a text string
        />
      );
    }
  };
}
