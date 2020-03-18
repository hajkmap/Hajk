import React from "react";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";

/**
 * Default export of function that takes html-string as input and returns array with MaterialUIComponents
 * @param {string} html String with html that needs to be converted to materialUIComponents
 * @returns {Array} Returns array with MaterialUI Components - see getAllowedHtmlTags to see the translation used
 * @memberof htmlToMaterialUiParser
 */
export default html => {
  let generatedHtml = [];
  let allowedHtmlTags = getAllowedHtmlTags();
  parseHtml(html, generatedHtml, allowedHtmlTags);
  return generatedHtml.map(tag => {
    let foundTag = allowedHtmlTags.find(
      element => element.tagType === tag.tagType
    );
    return foundTag.callback(tag.tagValue);
  });
};

/**
 * Private help method that adds all allowed html tags.
 *
 * @memberof Contents
 */
const getAllowedHtmlTags = () => {
  let allowedHtmlTags = [];
  allowedHtmlTags.push({ tagType: "h1", callback: renderHtmlTagH1 });
  allowedHtmlTags.push({ tagType: "h2", callback: renderHtmlTagH2 });
  allowedHtmlTags.push({ tagType: "h3", callback: renderHtmlTagH3 });
  allowedHtmlTags.push({ tagType: "h4", callback: renderHtmlTagH4 });
  allowedHtmlTags.push({ tagType: "h5", callback: renderHtmlTagH5 });
  allowedHtmlTags.push({ tagType: "h6", callback: renderHtmlTagH6 });
  allowedHtmlTags.push({ tagType: "img", callback: renderHtmlTagImg });
  allowedHtmlTags.push({ tagType: "p", callback: renderHtmlTagP });
  return allowedHtmlTags;
};

/**
 * Private help method that finds the start tag in the html text.
 * @param {string} html The html code.
 * @returns {string, string, string} Returns the tag type, tag value and the last index of the fist tag.
 *
 * @memberof Contents
 */
const findStartTag = html => {
  const indexStart = html.indexOf("<");
  let indexEnd = html.indexOf(">");
  let possibleIndexEnd = html.indexOf("/>");
  if (indexEnd - 1 === possibleIndexEnd) indexEnd = html.indexOf(" ");
  const tagType = html.substring(indexStart + 1, indexEnd);
  let tagEndIndex = findEndTag(html, tagType);
  if (tagEndIndex === -1) tagEndIndex = 1;
  const tagValue = html.substring(indexStart, tagEndIndex);

  return { tagType: tagType, tagValue: tagValue, tagEndIndex: tagEndIndex };
};

/**
 * Private help method that find the nest end tag.
 * @param {string} html The html text.
 * @param {string} tagType The type of html tag.
 *
 * @memberof Contents
 */
const findEndTag = (html, tagType) => {
  let hasEndTag = true;
  let indexStart = html.indexOf("</" + tagType + ">");
  if (indexStart === -1) {
    indexStart = html.indexOf("/>");
    hasEndTag = false;
  }
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
 */
const removeOuterTagTypeFromTagValue = (tagType, tagValue) => {
  const indexStart = tagValue.indexOf("<" + tagType + ">");
  let indexEnd = tagValue.lastIndexOf("</" + tagType + ">");
  if (indexEnd === -1) indexEnd = tagValue.lastIndexOf("/>");

  return tagValue.substring(indexStart + tagType.length + 2, indexEnd);
};

/**
 * The render function for the h1-tag.
 * @param {string} h1Tag The h1-tag.
 *
 * @memberof Contents
 */
const renderHtmlTagH1 = h1Tag => {
  let textToRender = h1Tag.substring(4, h1Tag.length - 5);
  return <Typography variant="h1">{textToRender}</Typography>;
};

/**
 * The render function for the h2-tag.
 * @param {string} h2Tag The h2-tag.
 *
 * @memberof Contents
 */
const renderHtmlTagH2 = h2Tag => {
  let textToRender = h2Tag.substring(4, h2Tag.length - 5);
  return <Typography variant="h2">{textToRender}</Typography>;
};

/**
 * The render function for the h3-tag.
 * @param {string} h3Tag The h3-tag.
 *
 * @memberof Contents
 */
const renderHtmlTagH3 = h3Tag => {
  let textToRender = h3Tag.substring(4, h3Tag.length - 5);
  return <Typography variant="h3">{textToRender}</Typography>;
};

/**
 * The render function for the h4-tag.
 * @param {string} h4Tag The h4-tag.
 *
 * @memberof Contents
 */
const renderHtmlTagH4 = h4Tag => {
  let textToRender = h4Tag.substring(4, h4Tag.length - 5);
  return <Typography variant="h4">{textToRender}</Typography>;
};

/**
 * The render function for the h5-tag.
 * @param {string} h5Tag The h5-tag.
 *
 * @memberof Contents
 */
const renderHtmlTagH5 = h5Tag => {
  let textToRender = h5Tag.substring(4, h5Tag.length - 5);
  return <Typography variant="h5">{textToRender}</Typography>;
};

/**
 * The render function for the h6-tag.
 * @param {string} h6Tag The h6-tag.
 *
 * @memberof Contents
 */
const renderHtmlTagH6 = h6Tag => {
  let textToRender = h6Tag.substring(4, h6Tag.length - 5);
  return <Typography variant="h6">{textToRender}</Typography>;
};

/**
 * The render function for the img-tag.
 * @param {string} imgTag The img-tag.
 *
 * @memberof Contents
 */
const renderHtmlTagImg = imgTag => {
  const indexOfSrcMaterial = imgTag.indexOf("=") + 2;
  let imageSource = imgTag.substring(indexOfSrcMaterial, imgTag.length - 3);
  //return <Typography variant="h1">{textToRender}</Typography>;
  return (
    <Card elevation="0">
      <CardMedia
        style={{ height: "100px", width: "100px" }} //TODO - Dynamic size of pictures, discuss this
        image={imageSource}
      />
    </Card>
  );
};

/**
 * The render function for the p-tag.
 * @param {string} pTag The p-tag.
 *
 * @memberof Contents
 */
const renderHtmlTagP = pTag => {
  let textToRender = pTag.substring(3, pTag.length - 4);
  return <Typography variant="body1">{textToRender}</Typography>;
};

/**
 * Parse the html code so that it can be translated into Material UI components.
 * Only html tags that can be found in the allowedHtmlTags will be added. The rest
 * will be ignored.
 * @param {object} html The html code.
 *
 * @memberof Contents
 */
const parseHtml = (html, generatedHtml, allowedHtmlTags) => {
  let { tagType, tagValue, tagEndIndex } = findStartTag(html);
  html = html.substring(tagEndIndex);

  if (hasTagInside(tagType, tagValue)) {
    tagValue = removeOuterTagTypeFromTagValue(tagType, tagValue);
    parseHtml(tagValue, generatedHtml, allowedHtmlTags);
  }

  if (allowedHtmlTags.map(item => item.tagType).includes(tagType))
    generatedHtml.push({ tagType: tagType, tagValue: tagValue });

  if (html.length > 0) parseHtml(html, generatedHtml, allowedHtmlTags);
};
