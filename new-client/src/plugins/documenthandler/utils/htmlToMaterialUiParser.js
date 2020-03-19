import React from "react";
import Card from "@material-ui/core/Card";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

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
    return foundTag.callback(tag);
  });
};

/**
 * Private help method that adds all allowed html tags.
 *
 * @memberof htmlToMaterialUiParser
 */
const getAllowedHtmlTags = () => {
  let allowedHtmlTags = [];
  allowedHtmlTags.push({ tagType: "br", callback: getBrtagTypography });
  allowedHtmlTags.push({ tagType: "h1", callback: getHeadingTypography });
  allowedHtmlTags.push({ tagType: "h2", callback: getHeadingTypography });
  allowedHtmlTags.push({ tagType: "h3", callback: getHeadingTypography });
  allowedHtmlTags.push({ tagType: "h4", callback: getHeadingTypography });
  allowedHtmlTags.push({ tagType: "h5", callback: getHeadingTypography });
  allowedHtmlTags.push({ tagType: "h6", callback: getHeadingTypography });
  allowedHtmlTags.push({ tagType: "img", callback: getTagImgCard });
  allowedHtmlTags.push({ tagType: "p", callback: getPtagTypography });
  return allowedHtmlTags;
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
 * Only html tags that can be found in the allowedHtmlTags will be added. The rest
 * will be ignored.
 * @param {object} html The html code.
 *
 * @memberof htmlToMaterialUiParser
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
  if (indexEnd - 1 === possibleIndexEnd) indexEnd = html.indexOf(" ");
  const tagType = html.substring(indexStart + 1, indexEnd);
  let tagEndIndex = findEndTag(html, tagType);
  if (tagEndIndex === -1) tagEndIndex = 1;
  let tagValue = html.substring(indexStart, tagEndIndex);

  return { tagType: tagType, tagValue: tagValue, tagEndIndex: tagEndIndex };
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
 * The render function for the br-tag.
 * @param {string} brTag The br-tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const getBrtagTypography = brTag => {
  return <Paper elevation="0" style={{ height: "20px" }} />;
};

/**
 * The render function for the h1 to h6-tag.
 * @param {string} tag The h1, h2, h3, h4, h5 or h6 tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const getHeadingTypography = tag => {
  let textToRender = tag.tagValue.substring(4, tag.tagValue.length - 5);
  return <Typography variant={tag.tagType}>{textToRender}</Typography>;
};

/**
 * The render function for the img-tag.
 * @param {string} imgTag The img-tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const getTagImgCard = imgTag => {
  const indexOfSrcMaterial = imgTag.tagValue.indexOf("=") + 2;
  let imageSource = imgTag.tagValue.substring(
    indexOfSrcMaterial,
    imgTag.tagValue.length - 3
  );
  return (
    <>
      <Paper elevation="0" style={{ height: "10px" }} />
      <Card elevation={0}>
        <CardMedia
          component="img"
          style={{ height: "200px", width: "auto", objectFit: "contain" }}
          image={imageSource}
        />
      </Card>
      <Typography variant="subtitle2">Lägg till bildtext här</Typography>
      <Typography variant="subtitle2">Lägg till källa/fotograf här</Typography>
      <Paper elevation="0" style={{ height: "20px" }} />
    </>
  );
};

/**
 * The render function for the p-tag.
 * @param {string} pTag The p-tag.
 *
 * @memberof htmlToMaterialUiParser
 */
const getPtagTypography = pTag => {
  let textToRender = pTag.tagValue.substring(3, pTag.tagValue.length - 4);
  return <Typography variant="body1">{textToRender}</Typography>;
};
