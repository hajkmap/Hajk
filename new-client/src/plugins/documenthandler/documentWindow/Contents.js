import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardMedia from "@material-ui/core/CardMedia";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

const styles = theme => {
  return {};
};

const allowedHtmlTags = [];
let generatedHtml = [];

class Contents extends React.PureComponent {
  state = {};

  /**
   * Constructor for the contents which renders all chapters in the document.
   * @param {object} props Contains the document that holds all chapters.
   *
   * @memberof Contents
   */
  constructor(props) {
    super(props);
    this.document = this.props.document;

    this.addAllowedHtmlTags();
  }

  /**
   * Private help method that adds all allowed html tags.
   *
   * @memberof Contents
   */
  addAllowedHtmlTags = () => {
    allowedHtmlTags.push({ tagType: "h1", callback: this.renderHtmlTagH1 });
    allowedHtmlTags.push({ tagType: "h2", callback: this.renderHtmlTagH2 });
    allowedHtmlTags.push({ tagType: "h3", callback: this.renderHtmlTagH3 });
    allowedHtmlTags.push({ tagType: "h4", callback: this.renderHtmlTagH4 });
    allowedHtmlTags.push({ tagType: "h5", callback: this.renderHtmlTagH5 });
    allowedHtmlTags.push({ tagType: "h6", callback: this.renderHtmlTagH6 });
    allowedHtmlTags.push({ tagType: "img", callback: this.renderHtmlTagImg });
    allowedHtmlTags.push({ tagType: "p", callback: this.renderHtmlTagP });
  };

  /**
   * Parse the html code so that it can be translated into Material UI components.
   * Only html tags that can be found in the allowedHtmlTags will be added. The rest
   * will be ignored.
   * @param {object} html The html code.
   *
   * @memberof Contents
   */
  parseHtml = html => {
    let { tagType, tagValue, tagEndIndex } = this.findStartTag(html);
    html = html.substring(tagEndIndex);

    if (this.hasTagInside(tagType, tagValue)) {
      tagValue = this.removeOuterTagTypeFromTagValue(tagType, tagValue);
      this.parseHtml(tagValue);
    }

    if (allowedHtmlTags.map(item => item.tagType).includes(tagType))
      generatedHtml.push({ tagType: tagType, tagValue: tagValue });

    if (html.length > 0) this.parseHtml(html);
  };

  /**
   * Private help method that finds the start tag in the html text.
   * @param {string} html The html code.
   * @returns {string, string, string} Returns the tag type, tag value and the last index of the fist tag.
   *
   * @memberof Contents
   */
  findStartTag = html => {
    const indexStart = html.indexOf("<");
    let indexEnd = html.indexOf(">");
    let possibleIndexEnd = html.indexOf("/>");
    if (indexEnd - 1 === possibleIndexEnd) indexEnd = html.indexOf(" ");
    const tagType = html.substring(indexStart + 1, indexEnd);
    let tagEndIndex = this.findEndTag(html, tagType);
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
  findEndTag = (html, tagType) => {
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
  hasTagInside = (tagType, tagValue) => {
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
  removeOuterTagTypeFromTagValue = (tagType, tagValue) => {
    const indexStart = tagValue.indexOf("<" + tagType + ">");
    let indexEnd = tagValue.lastIndexOf("</" + tagType + ">");
    if (indexEnd === -1) indexEnd = tagValue.lastIndexOf("/>");

    return tagValue.substring(indexStart + tagType.length + 2, indexEnd);
  };

  /**
   * Renders the document with all it's chapters and sub chapters.
   * @param {object} document The document that will be rendered.
   *
   * @memberof Contents
   */
  renderChapters = chapters => {
    return (
      <>
        {Array.isArray(chapters)
          ? chapters.map(chapter => this.renderChapter(chapter))
          : null}
      </>
    );
  };

  /**
   * Renders a chapter with a headline an a content.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderChapter = chapter => {
    return (
      <>
        <Grid item xs={12}>
          {this.renderHeadline(chapter)}
        </Grid>
        <Grid item xs={12}>
          {this.renderContents(chapter)}
        </Grid>
        {Array.isArray(chapter.chapters)
          ? chapter.chapters.map(subChapter => this.renderChapter(subChapter))
          : null}
      </>
    );
  };

  /**
   * Render the headline of a chapter.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderHeadline = chapter => {
    return <Typography variant="h4">{chapter.header}</Typography>;
  };

  /**
   * Render all the contents.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderContents = chapter => {
    generatedHtml = [];
    this.parseHtml(chapter.html);
    return generatedHtml.map(tag => {
      let foundTag = allowedHtmlTags.find(
        element => element.tagType === tag.tagType
      );
      return foundTag.callback(tag.tagValue);
    });
  };

  /**
   * The render function for the h1-tag.
   * @param {string} h1Tag The h1-tag.
   *
   * @memberof Contents
   */
  renderHtmlTagH1 = h1Tag => {
    let textToRender = h1Tag.substring(4, h1Tag.length - 5);
    return <Typography variant="h1">{textToRender}</Typography>;
  };

  /**
   * The render function for the h2-tag.
   * @param {string} h2Tag The h2-tag.
   *
   * @memberof Contents
   */
  renderHtmlTagH2 = h2Tag => {
    let textToRender = h2Tag.substring(4, h2Tag.length - 5);
    return <Typography variant="h2">{textToRender}</Typography>;
  };

  /**
   * The render function for the h3-tag.
   * @param {string} h3Tag The h3-tag.
   *
   * @memberof Contents
   */
  renderHtmlTagH3 = h3Tag => {
    let textToRender = h3Tag.substring(4, h3Tag.length - 5);
    return <Typography variant="h3">{textToRender}</Typography>;
  };

  /**
   * The render function for the h4-tag.
   * @param {string} h4Tag The h4-tag.
   *
   * @memberof Contents
   */
  renderHtmlTagH4 = h4Tag => {
    let textToRender = h4Tag.substring(4, h4Tag.length - 5);
    return <Typography variant="h4">{textToRender}</Typography>;
  };

  /**
   * The render function for the h5-tag.
   * @param {string} h5Tag The h5-tag.
   *
   * @memberof Contents
   */
  renderHtmlTagH5 = h5Tag => {
    let textToRender = h5Tag.substring(4, h5Tag.length - 5);
    return <Typography variant="h5">{textToRender}</Typography>;
  };

  /**
   * The render function for the h6-tag.
   * @param {string} h6Tag The h6-tag.
   *
   * @memberof Contents
   */
  renderHtmlTagH6 = h6Tag => {
    let textToRender = h6Tag.substring(4, h6Tag.length - 5);
    return <Typography variant="h6">{textToRender}</Typography>;
  };

  /**
   * The render function for the img-tag.
   * @param {string} imgTag The img-tag.
   *
   * @memberof Contents
   */
  renderHtmlTagImg = imgTag => {
    const indexOfSrcMaterial = imgTag.indexOf("=") + 2;
    let imageSource = imgTag.substring(indexOfSrcMaterial, imgTag.length - 3);
    //return <Typography variant="h1">{textToRender}</Typography>;
    return (
      <Card>
        <CardActionArea>
          <CardMedia image={imageSource} />
        </CardActionArea>
      </Card>
    );
  };

  /**
   * The render function for the p-tag.
   * @param {string} pTag The p-tag.
   *
   * @memberof Contents
   */
  renderHtmlTagP = pTag => {
    let textToRender = pTag.substring(3, pTag.length - 4);
    return <Typography variant="body1">{textToRender}</Typography>;
  };

  render() {
    const { classes, document } = this.props;
    return <>{this.renderChapters(document?.chapters)}</>;
  }
}

export default withStyles(styles)(Contents);
