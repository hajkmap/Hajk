/**
 * Default export of function that takes a html-string as input and returns array with MaterialUIComponents
 * @param {string} html String with html that needs to be converted to materialUIComponents
 * @param {Array} tagSpecificCallbacks Tags that should be interpreted to Material UI components, the rest will be ignored.
 * @returns {Array} Returns array with MaterialUI Components - see gettagSpecificCallbacks to see the translation used
 * @memberof htmlToMaterialUiParser
 */

export default (html, tagSpecificCallbacks) => {
  let generatedHtml = [];

  parseHtml(html, generatedHtml, tagSpecificCallbacks);
  return generatedHtml.map(tag => {
    let foundTag = tagSpecificCallbacks.find(
      element => element.tagType === tag.tagType
    );
    return foundTag.callback(tag);
  });
};

/**
 * Private help method that adds all tags that has no ending, e.g. the br tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const getTagsWithoutEnding = () => {
  return ["br"];
};

/**

 * Parse the html code so that it can be translated into Material UI components.
 * Only html tags that can be found in the tagSpecificCallbacks will be added. The rest
 * will be ignored.
 * @param {object} html The html code.
 *
 * @memberof htmlToMaterialUiParser
 */
const parseHtml = (html, generatedHtml, tagSpecificCallbacks) => {
  let { tagType, tagValue, tagEndIndex } = findStartTag(html);

  if (hasTagInside(tagType, tagValue)) {
    tagValue = removeOuterTagTypeFromTagValue(tagType, tagValue);
    parseHtml(tagValue, generatedHtml, tagSpecificCallbacks);
  }

  if (tagSpecificCallbacks.map(item => item.tagType).includes(tagType))
    if (!addTagToGeneratedHtml(tagType, tagValue))
      generatedHtml.push({ tagType: tagType, tagValue: tagValue });

  html = html.substring(tagEndIndex);
  if (html.length > 0) parseHtml(html, generatedHtml, tagSpecificCallbacks);
};

/**
 * Private help method that finds the start tag in the html text.
 * @param {string} html The html code.
 * @returns {string, string, string} Returns the tag type, tag value and the last index of the fist tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const findStartTag = html => {
  const indexStart = html.indexOf("<");
  let indexEnd = html.indexOf(">");

  let possibleIndexEnd = html.indexOf("/>");
  if (indexEnd - 1 === possibleIndexEnd) {
    indexEnd = html.indexOf(" ");
  }

  let tagType = getTagType(html, indexStart, indexEnd);

  let tagEndIndex = findEndTag(html, tagType);
  if (tagEndIndex === -1) tagEndIndex = 1;
  let tagValue = html.substring(indexStart, tagEndIndex);

  return {
    tagType: tagType,
    tagValue: tagValue,
    tagEndIndex: tagEndIndex
  };
};

/**
 * Private help method that finds the start tag in the html text.
 * @param {string} html The html code.
 * @param {int} indexStart The html code.
 * @param {int} indexEnd The html code.
 * @returns {string, int, int} Returns the tag type, tag value and the last index of the fist tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const getTagType = (html, indexStart, indexEnd) => {
  const tagTypeWithOptionalAttributes = html.substring(
    indexStart + 1,
    indexEnd
  );
  let startIndexOfAttributes = tagTypeWithOptionalAttributes.indexOf(" ");
  let tagType = tagTypeWithOptionalAttributes;

  if (startIndexOfAttributes > -1) {
    tagType = html.substring(
      indexStart + 1,
      indexStart + 1 + startIndexOfAttributes
    );
  }
  return tagType;
};

/**
 * Private help method that find the nest end tag.
 * @param {string} html The html text.
 * @param {string} tagType The type of html tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const findEndTag = (html, tagType) => {
  if (
    getTagsWithoutEnding()
      .map(item => item)
      .includes(tagType)
  ) {
    return tagType.length + 2;
  }

  let hasEndTag = true;
  let indexStart = html.indexOf("</" + tagType + ">");
  if (indexStart === -1) {
    indexStart = html.indexOf("/>");
    hasEndTag = false;
  }
  if (indexStart === -1) indexStart = html.indexOf("<" + tagType + ">");

  let indexEnd = indexStart + 2;
  if (hasEndTag) indexEnd = indexEnd + tagType.length + 1;

  return indexEnd;
};

/**
 * Private help method that determines if a tag has another tag inside itself.
 * @param {string} tagType The tag type.
 * @param {string} tagValue The text inside a tag, including the tag itself.
 * @return {boolean} Returns true if the tag contains another tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const hasTagInside = (tagType, tagValue) => {
  let htmlInsideTag = tagValue.substring(tagType.length + 2);
  let indexTagEnd = htmlInsideTag.indexOf("</" + tagType + ">");
  if (indexTagEnd === -1) indexTagEnd = htmlInsideTag.indexOf("/>");
  htmlInsideTag = htmlInsideTag.substring(0, indexTagEnd);
  const indexStartFirst = htmlInsideTag.indexOf("<");
  const indexStartLast = htmlInsideTag.lastIndexOf("<");
  const indexEndFirst = htmlInsideTag.indexOf(">");
  const indexEndLast = htmlInsideTag.lastIndexOf(">");
  if (
    indexStartFirst === -1 ||
    indexStartLast === -1 ||
    indexEndFirst === -1 ||
    indexEndLast === -1
  )
    return false;

  return true;
};

/**
 * Private help method that removes the outer tag type from a tag value.
 * @param {string} tagType The tag type.
 * @param {string} tagValue The tag value.
 * @returns {string} Returns the tag value minus the outer tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const removeOuterTagTypeFromTagValue = (tagType, tagValue) => {
  const indexStart = tagValue.indexOf("<" + tagType + ">");
  let indexEnd = tagValue.lastIndexOf("</" + tagType + ">");
  if (indexEnd === -1) indexEnd = tagValue.lastIndexOf("/>");

  return tagValue.substring(indexStart + tagType.length + 2, indexEnd);
};

/**
 * Private help method that determines if a tag should be added.
 * @param {string} tagValue The html tag value that should be investigated.
 */
const addTagToGeneratedHtml = (tagType, tagValue) => {
  let startTag = findStartTag(tagValue).tagType;
  if (
    tagType !== startTag &&
    getTagsWithoutEnding()
      .map(item => item)
      .includes(startTag)
  ) {
    return true;
  }

  return false;
};
