import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import gfm from "remark-gfm";
import FeaturePropFilters from "./FeaturePropsFilters";
import AppModel from "models/AppModel.js";

import {
  customComponentsForReactMarkdown, // the object with all custom components
  setOptions, // a method that will allow us to send infoclick options from here to the module that defines custom components
  Paragraph, // special case - we want to override the Paragraph component here, so we import it separately
} from "utils/customComponentsForReactMarkdown";

export default class FeaturePropsParsing {
  constructor(settings) {
    this.globalObserver = settings.globalObserver;
    this.options = settings.options;

    // Send the options to our custom components module too. This is necessary
    // and without it we won't be able to access Hajk's settings in customComponentsForReactMarkdown
    // because it's not a class that we initiate (only a plain JS object).
    // Also, see #1106.
    setOptions(this.options);

    // Two arrays that will hold pending promises and their resolved values, respectively.
    this.pendingPromises = [];
    this.resolvedPromisesWithComponents = [];

    this.markdown = null;
    this.properties = null; // Will hold the property values from the clicked feature

    // Default to true to ensure backwards compatibility with old configs that predominately use HTML
    this.allowDangerousHtml = this.options.allowDangerousHtml ?? true;

    // Here we define the components used by ReactMarkdown, see https://github.com/remarkjs/react-markdown#appendix-b-components
    // Note that we import customComponentsForReactMarkdown from our shared library, spread those
    // objects and finally override the definition of "p", as it differs in this case (we want to
    // import external components in FeatureInfo, while the normal "p" implementation just maps P to
    // a MUI Typography component).
    this.components = {
      ...customComponentsForReactMarkdown,
      p: ({ children }) => {
        if (!children) {
          return null;
        }

        return (
          <Paragraph variant="body2">
            {children.map((child, index) => {
              // Initiate a holder for external components. If a regex matches below,
              // this variable will be filled with correct value.
              let externalComponent = null;

              if (child && typeof child === "string") {
                // This helper is passed to ReactMarkdown at render. At this stage,
                // we expect that the only remaining {stuff} will contain digits, and
                // that those numbers represent element index in this.resolvedPromisesWithComponents.
                // Let's try to match the regex for a number within curly brackets.
                const match = child.match(/{(\d+)}/);
                if (
                  match &&
                  this.resolvedPromisesWithComponents.hasOwnProperty(match[1])
                ) {
                  // If matched, replace the placeholder with the corresponding component.
                  externalComponent =
                    this.resolvedPromisesWithComponents[match[1]];
                }
              }
              // If externalComponent isn't null anymore, render it. Else, just render the children.
              return (
                <React.Fragment key={index}>
                  {externalComponent || child}
                </React.Fragment>
              );
            })}
          </Paragraph>
        );
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
    } else if (placeholder.includes("|")) {
      return FeaturePropFilters.applyFilters(this.properties, placeholder);
    }
    // Just a "normal" placeholder, e.g. {foobar}
    else {
      // Attempt to grab the actual value from the Properties collection, if not found, fallback to empty string.
      // Note that we must replace equal sign in property value, else we'd run into trouble, see #812.
      return (
        // What you see on the next line is what we call "hängslen och livrem" in Sweden.
        // (The truth is it's all needed - this.properties may not be an Array, it may not have a key named
        // "placeholder", but if it does, we can't be sure that it will have the replace() method (as only Strings have it).)
        this.properties?.[placeholder]?.replace?.(/=/g, "&equal;") || // If replace() exists, it's a string, so we can revert our equal signs.
          this.properties[placeholder] != null
          ? this.properties[placeholder]
          : "" // If not a string, return the value as-is…
        // …unless it's undefined or null - in that case, return an empty string.
      );
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

        // Handle <if foo="bar">, <if foo=bar> as well as <if foo!="bar"> and <if foo!=bar>
        if (matched.attributes?.includes("=")) {
          // We allow two comparers: "equal" ("=") and "not equal" ("!=")
          const comparer = matched.attributes.includes("!=") ? "!=" : "=";

          // Turn "FOO=\"BAR\"" into k = "FOO" and v = "BAR"
          const [k, v] = matched.attributes
            .split(comparer) // Create an array by splitting the attributes on our comparer string
            .map((e) => e.replaceAll('"', "").trim()); // Remove double quotes and whitespace

          switch (comparer) {
            // See #669
            case "=":
              // Using truthy equal below: we want 2 and "2" to be seen as equal.
              // eslint-disable-next-line eqeqeq
              if (k == v) {
                return matched.content;
              } else {
                return "";
              }
            // See #1128
            case "!=":
              // Using truthy not equal below: we want '2 is not equal "2"' to evaluate to false.
              // eslint-disable-next-line eqeqeq
              if (k != v) {
                return matched.content;
              } else {
                return "";
              }
            default:
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
   * @summary Ensure that the href part in Markdown links is well-formatted
   * @description Href in Markdown should be UTF8 formatted and have whitespace
   * escaped (with %20). The easiest way to ensure proper formatting is using the
   * URL object. But the constructor of URL will crash if the string provided is
   * not a proper path (e.g. lacks the protocol part). So we use try-catch to
   * catch such occurrences, and in those cases, we return the anchor pretty much unchanged.
   *
   * @param {*} args
   * @returns
   */
  #markdownHrefEncoder = (...args) => {
    // The named capture groups will be the last parameter
    const matched = args[args.length - 1];

    // Anchor text and title are simple
    const text = matched.text;
    const title = matched.title ? " " + matched.title : "";

    // Anchor href will require some more work.
    let href = matched.href;

    try {
      // Try creating a new URL from the matched href.
      // Invoking new URL will escape any special characters and ensure
      // that we provide a well-formatted URL to the MarkDown.
      href = new URL(href);
    } catch (error) {
      // If the URL creation failed for some reason (e.g. if a.href was empty,
      // or if it was a relative path), fall back to using the provided
      // string as-is, but remember to remove the leading and closing parentheses
      // that our regex included in the match and encode the URL (i.e. still
      // transform 'dir/file åäö.pdf' to 'dir/file%20%C3%A5%C3%A4%C3%B6.pdf').
      href = encodeURI(href);
    }

    // Prepare a nice MD Anchor string
    const r = `[${text}](${href}${title})`;
    return r;
  };

  #decorateProperties(prefix, kvData) {
    Object.entries(kvData).forEach(([key, value]) => {
      this.properties[`${prefix}:${key}`] = value;
    });
  }

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

    // Here we can decorate the incoming properties with data from the last click in the map.
    // By decorating, these props can be used like any other prop.
    this.#decorateProperties("click", AppModel.getClickLocationData());

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
      // Match any word character, range of unicode characters (åäö etc), @ sign, dash or dot
      (this.markdown.match(/{[\s\w\u00C0-\u00ff@\-|,'.():]+}/g) || []).forEach(
        (placeholder) => {
          // placeholder is a string, e.g. "{intern_url_1@@documenthandler}" or "{foobar}"
          // Let's replace all occurrences of the placeholder like this:
          // {foobar} -> Some nice FoobarValue
          // {intern_url_1@@documenthandler} -> {n} // n is element index in the array that will hold Promises from external components
          this.markdown = this.markdown.replace(
            placeholder,
            this.#getPropertyValueForPlaceholder(placeholder)
          );
        }
      );

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

      // Special precautious must be taken to accommodate white space in Markdown links. We can
      // of course force our Hajk admins to write correctly formatted links (with URL encoded spaces),
      // but many times we can not control the URL if it comes from outside source. E.g. imagine this
      // infoclick setup:
      // [{anchorText}]({anchorLink})
      // Depending on values in the database, this can end up as something like this:
      // [This is a link](https://www.example.com/Some PDF file we link to.pdf)
      // This will not render correctly, only "https://www.example.com/Some" will become the
      // href part of the anchor. What we want instead is our MarkDown to contain:
      // [This is a link](https://www.example.com/Some%20PDF%20file%20we%20link%20to.pdf)
      // The following regex does just that.
      this.markdown = this.markdown.replace(
        /\[(?<text>[^[]+)\]\((?<href>[^")]+)(?<title>".*")?\)/gm,
        this.#markdownHrefEncoder
      );

      // Back in #getPropertyValueForPlaceholder we encode all equal signs ("=") as "&equal;",
      // to ensure we don't run into the issue described in #812 when we do the conditional check.
      // Now is a good time to revert that encoding back into an equal sign.
      this.markdown = this.markdown.replace(/&equal;/g, "=");

      // The final step is to await for all promises that might exist (if we fetch from
      // external components) to fulfill. We can't render before that!
      this.resolvedPromisesWithComponents = await Promise.all(
        this.pendingPromises
      );

      // If admin wants to allow HTML in Markdown, add rehypeRaw plugin.
      // Note that the gfm plugin is always added: it gives access to Table syntax.
      const rehypePlugins = this.allowDangerousHtml ? [rehypeRaw] : [];

      // Now, when promises are fulfilled, we can render. One of the render's helpers
      // will make use of the results in this.resolvedPromises, so that's why we had to wait.
      return (
        <ReactMarkdown
          remarkPlugins={[gfm]} // GitHub Formatted Markdown adds support for Tables in MD
          rehypePlugins={rehypePlugins} // Needed to parse HTML, activated in admin
          components={this.components} // Custom renderers for components, see definition in this.components
          children={this.markdown} // Our MD, as a text string
        />
      );
    }
  };
}
