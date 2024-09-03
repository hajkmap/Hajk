import { v4 as uuidv4 } from "uuid";

/**
 * Default export of function that takes a html-string as input and returns array with MaterialUIComponents
 * @param {string} html String with html that needs to be converted to materialUIComponents
 * @param {Array} tagSpecificCallbacks Tags that should be interpreted to Material UI components, the rest will be ignored.
 * @returns {Array} Returns array with MaterialUI Components - see getTagSpecificCallbacks to see the translation used
 * @memberof htmlToMaterialUiParser
 */
const htmlToMaterialUIParser = (html, tagSpecificCallbacks) => {
  let parser = new DOMParser();
  let htmlDoc = parser.parseFromString(html, "text/html");
  for (const child of htmlDoc.body.children) {
    parseChild(child, tagSpecificCallbacks);
  }

  let generatedHtml = [...htmlDoc.body.children];
  return generatedHtml.map((tag) => {
    if (tag.callback) return tag.callback(tag);
    return null;
  });
};

const parseChild = (child, tagSpecificCallbacks) => {
  let callbackObject = tagSpecificCallbacks.find((object) => {
    return object.tagType.toLowerCase() === child.tagName.toLowerCase();
  });

  // We only provide callbacks for a portion of allowed HTML
  // tags in tagSpecificCallbacks. Only supply a callback
  // if it was defined.
  child.callback = callbackObject?.callback;

  child.componentId = uuidv4();
  if (child.children.length > 0) {
    for (const subChild of child.children) {
      parseChild(subChild, tagSpecificCallbacks);
    }
  }
};

export default htmlToMaterialUIParser;
