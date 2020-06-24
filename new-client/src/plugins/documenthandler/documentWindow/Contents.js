import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import CardMedia from "@material-ui/core/CardMedia";
import ImagePopupModal from "./ImagePopupModal";
import htmlToMaterialUiParser from "../utils/htmlToMaterialUiParser";
import TextArea from "./TextArea";

import { Link } from "@material-ui/core";

const styles = theme => {
  return {
    documentImage: {
      height: "300px",
      cursor: "pointer",
      width: "100%",
      objectFit: "contain"
    },
    typography: {
      overflowWrap: "break-word"
    },
    chapter: {
      cursor: "text",
      marginTop: theme.spacing(4)
    }
  };
};

class Contents extends React.PureComponent {
  state = {
    popupImage: null
  };

  /**
   * Private help method that adds all allowed html tags.
   *
   * @memberof Contents
   */
  getTagSpecificCallbacks = () => {
    let allowedHtmlTags = [];
    allowedHtmlTags.push({
      tagType: "br",
      callback: this.getBrtagTypographyComponent
    });
    allowedHtmlTags.push({
      tagType: "h1",
      callback: this.getHeadingTypographyComponents
    });
    allowedHtmlTags.push({
      tagType: "blockquote",
      callback: this.getBlockQuoteComponents
    });
    allowedHtmlTags.push({
      tagType: "h2",
      callback: this.getHeadingTypographyComponents
    });
    allowedHtmlTags.push({
      tagType: "h3",
      callback: this.getHeadingTypographyComponents
    });
    allowedHtmlTags.push({
      tagType: "h4",
      callback: this.getHeadingTypographyComponents
    });
    allowedHtmlTags.push({
      tagType: "h5",
      callback: this.getHeadingTypographyComponents
    });
    allowedHtmlTags.push({
      tagType: "h6",
      callback: this.getHeadingTypographyComponents
    });
    allowedHtmlTags.push({
      tagType: "a",
      callback: this.getLinkComponent
    });
    allowedHtmlTags.push({
      tagType: "img",
      callback: this.getImgCardComponent
    });
    allowedHtmlTags.push({
      tagType: "p",
      callback: this.getPtagTypographyComponents
    });
    allowedHtmlTags.push({
      tagType: "figure",
      callback: this.getFigureComponents
    });
    return allowedHtmlTags;
  };

  getMaterialUIComponentsForChapter = chapter => {
    return htmlToMaterialUiParser(
      chapter.html,
      this.getTagSpecificCallbacks()
    ).map((component, index) => {
      return <React.Fragment key={index}>{component}</React.Fragment>;
    });
  };

  appendComponentsToChapter = chapter => {
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach((subChapter, index) => {
        subChapter.components = this.getMaterialUIComponentsForChapter(
          subChapter
        );
      });
    }
    chapter.components = this.getMaterialUIComponentsForChapter(chapter);
    return chapter;
  };

  appendParsedComponentsToDocument = () => {
    const { activeDocument } = this.props;
    activeDocument.chapters.forEach((chapter, index) => {
      activeDocument.chapters[index] = this.appendComponentsToChapter(chapter);
    });
  };

  /**
   * Helper method to extract attributes from html-element
   * @param {Element} htmlObject Basic html-element.
   * @returns {Object{dataAttribute : string, dataValue : string}} Returns name of attribute and its value ion key-value-pair
   *
   * @memberof Contents
   */
  getDataAttributesFromHtmlObject = htmlObject => {
    let attributes = htmlObject
      .getAttributeNames()
      .map(function(attributeName) {
        return {
          dataAttribute: attributeName,
          dataValue: htmlObject.getAttribute(attributeName)
        };
      });
    return attributes;
  };

  /**
   * Private help method that extracts the text, i.e. the link text it selfs, from an a-tag.
   * @param {object} htmlObject The a-tag.
   * @returns {string} The link text in the a-tag.
   *
   * @memberof Contents
   */
  getTextLinkTextFromHtmlObject = htmlObject => {
    return htmlObject.text;
  };

  getCustomLink = (htmlObject, clickHandler) => {
    return (
      <Link href="#" variant="body2" onClick={clickHandler}>
        {htmlObject.innerHTML}
      </Link>
    );
  };

  getExternalLink = (aTagObject, externalLink) => {
    return (
      <Link href={externalLink} target="_blank" rel="noopener" variant="body2">
        {aTagObject.innerHTML}
      </Link>
    );
  };

  getMapLink = (aTagObject, mapLink) => {
    const { localObserver } = this.props;
    return this.getCustomLink(aTagObject, () => {
      localObserver.publish("fly-to", mapLink);
    });
  };

  getHeaderLinkForNonActiveDocument = (
    aTagObject,
    headerIdentifier,
    documentLink
  ) => {
    const { localObserver } = this.props;
    localObserver.publish("show-document-window", {
      documentName: documentLink,
      headerIdentifier: headerIdentifier
    });
  };

  getHeaderLinkForSameDocument = (aTagObject, headerIdentifier) => {
    const { localObserver, model } = this.props;
    localObserver.publish(
      "scroll-to",
      model.getHeaderRef(this.props.activeDocument, headerIdentifier)
    );
  };

  getLinkDataPerType = attributes => {
    const {
      0: mapLink,
      1: headerIdentifier,
      2: documentLink,
      3: externalLink
    } = ["data-maplink", "data-header", "data-document", "data-link"].map(
      attributeKey => {
        return this.getValueFromAttribute(attributes, attributeKey);
      }
    );

    return { mapLink, headerIdentifier, documentLink, externalLink };
  };

  parseStringToHtmlObject = (htmlString, type) => {
    var mockedHtmlObject = document.createElement(type);
    mockedHtmlObject.innerHTML = htmlString;
    return mockedHtmlObject.firstChild;
  };
  /**
   * Extracts value for a key-value-pair
   * @param {Object} attributes object with key-value-pair of attributes.
   * @param {String} dataKey key to extract value from
   * @returns {String} Returns data value
   *
   * @memberof Contents
   */
  getValueFromAttribute = (attributes, dataKey) => {
    return attributes.find(attribute => {
      return attribute.dataAttribute === dataKey;
    })?.dataValue;
  };

  getTextArea = (text, index) => {
    const blockQuote = this.parseStringToHtmlObject(
      `<blockquote ${text}</blockquote>`,
      "blockquote"
    );
    return (
      <TextArea
        key={index}
        backgroundColor=""
        dividerColor=""
        text={blockQuote.textContent}
      ></TextArea>
    );
  };

  getBlockQuoteComponents = tag => {
    if (!Array.isArray(tag.text) && tag.text.includes("data-text-section")) {
      return this.getTextArea(tag.text);
    } else {
      var result = tag.text.map((element, index) => {
        var text = element.text;
        if (element.text.includes("data-text-section")) {
          return this.getTextArea(element.text, index);
        }

        if (element.tagType === null) {
          return <blockquote key={index}>{text}</blockquote>;
        }

        return (
          <React.Fragment key={index}>
            {element.renderCallback(element)}
          </React.Fragment>
        );
      });
    }

    return result;
  };

  /**
   * Callback used to render different link-components from a-elements
   * @param {Element} aTag a-element.
   * @returns {<Link>} Returns materialUI component <Link>
   *
   * @memberof Contents
   */
  getLinkComponent = aTag => {
    console.log(aTag.text, "??");
    const aTagObject = this.parseStringToHtmlObject(`<a ${aTag.text}</a>`, "a");
    const attributes = this.getDataAttributesFromHtmlObject(aTagObject);
    console.log(attributes, "attrrr");
    const text = this.getTextLinkTextFromHtmlObject(aTagObject);
    const {
      mapLink,
      headerIdentifier,
      documentLink,
      externalLink
    } = this.getLinkDataPerType(attributes);

    if (headerIdentifier) {
      if (documentLink) {
        return (
          <Link
            onClick={() => {
              this.getHeaderLinkForNonActiveDocument(
                aTagObject,
                headerIdentifier,
                documentLink
              );
            }}
          >
            {text}
          </Link>
        );
      } else {
        return (
          <Link
            href="#"
            underline="hover"
            onClick={() => {
              this.getHeaderLinkForSameDocument(
                aTagObject,
                headerIdentifier,
                documentLink
              );
            }}
          >
            {text}
          </Link>
        );
      }
    }

    if (mapLink) {
      return this.getMapLink(aTagObject, mapLink);
    }

    if (externalLink) {
      return this.getExternalLink(aTagObject, externalLink);
    }
  };

  getFigureComponents = figureTag => {
    var result = figureTag.text.map((element, index) => {
      if (element.tagType === null) {
        return null;
      }
      return (
        <React.Fragment key={index}>
          {element.renderCallback(element)}
        </React.Fragment>
      );
    });

    return result;
  };

  /**
   * The render function for the img-tag.
   * @param {string} imgTag The img-tag.
   *
   * @memberof Contents
   */
  getImgCardComponent = imgTag => {
    const { classes } = this.props;
    const indexOfCaption = imgTag.text.indexOf("data-caption=");
    const indexOfSource = imgTag.text.indexOf("data-source=");
    const indexOfSrcMaterial = imgTag.text.indexOf("src=");
    const imageCaption = imgTag.text.substring(
      indexOfCaption + 14,
      indexOfSource - 2
    );
    const imageSource = imgTag.text.substring(
      indexOfSource + 13,
      indexOfSrcMaterial - 2
    );
    const imageUrl = imgTag.text.substring(
      indexOfSrcMaterial + 5,
      imgTag.text.length - 1
    );
    return (
      <>
        <CardMedia
          onClick={() => {
            this.showPopupModal(imageUrl);
          }}
          component="img"
          className={classes.documentImage}
          image={imageUrl}
        />
        <Typography className={classes.typography} variant="subtitle2">
          {imageCaption}
        </Typography>
        <Typography className={classes.typography} variant="subtitle2">
          {imageSource}
        </Typography>
      </>
    );
  };

  /**
   * The render function for the p-tag.
   * @param {string} pTag The p-tag.
   *
   * @memberof Contents
   */
  getPtagTypographyComponents = pTag => {
    const { classes } = this.props;

    return pTag.text.map((element, index) => {
      if (element.tagType === null) {
        return (
          <Typography
            key={index}
            className={classes.typography}
            variant="body1"
          >
            {element.text}
          </Typography>
        );
      }
      return (
        <React.Fragment key={index}>
          {element.renderCallback(element)}
        </React.Fragment>
      );
    });
  };

  /**
   * The render function for the br-tag.
   * @param {string} brTag The br-tag.
   *
   * @memberof htmlToMaterialUiParser
   */
  getBrtagTypographyComponent = brTag => {
    return <br />;
  };

  getHeadingTypographyComponents = tag => {
    const { classes } = this.props;

    return tag.text.map((element, index) => {
      if (element.tagType === null) {
        return (
          <Typography
            key={index}
            className={classes.typography}
            variant={tag.tagType}
          >
            {element.text}
          </Typography>
        );
      }

      return (
        <React.Fragment key={index}>
          {element.renderCallback(element)}
        </React.Fragment>
      );
    });
  };

  closePopupModal = () => {
    console.log("??");
    this.setState({ popupImage: null });
  };

  showPopupModal = imageSource => {
    this.setState({ popupImage: imageSource });
  };

  renderImageInModal = () => {
    const { popupImage } = this.state;

    return (
      <ImagePopupModal
        open={popupImage == null ? false : true}
        close={this.closePopupModal}
        image={popupImage}
      ></ImagePopupModal>
    );
  };

  /**
   * Renders the document with all it's chapters and sub chapters.
   * @param {object} document The document that will be rendered.
   *
   * @memberof Contents
   */
  renderChapters = chapters => {
    return Array.isArray(chapters)
      ? chapters.map(chapter => this.renderChapter(chapter))
      : null;
  };

  /**
   * Renders a chapter with a headline an a content.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderChapter = chapter => {
    const { classes } = this.props;
    return (
      <Grid
        className={classes.chapter}
        container
        item
        alignItems="center"
        key={chapter.id}
      >
        <Grid item xs={12}>
          {this.renderHeadline(chapter)}
        </Grid>
        <Grid item xs={12}>
          {chapter.components}
        </Grid>
        {Array.isArray(chapter.chapters)
          ? chapter.chapters.map(subChapter => this.renderChapter(subChapter))
          : null}
      </Grid>
    );
  };

  /**
   * Render the headline of a chapter.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderHeadline = chapter => {
    const { classes } = this.props;

    return (
      <>
        <Typography
          ref={chapter.scrollRef}
          className={classes.typography}
          variant={chapter.parent ? "h3" : "h2"}
        >
          {chapter.header}
        </Typography>
      </>
    );
  };

  render = () => {
    const { activeDocument } = this.props;
    this.appendParsedComponentsToDocument();
    return (
      <>
        {this.renderImageInModal()}
        {this.renderChapters(activeDocument.chapters)}
      </>
    );
  };
}

export default withStyles(styles)(Contents);
