import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import CardMedia from "@material-ui/core/CardMedia";
import ImagePopupModal from "./ImagePopupModal";
import htmlToMaterialUiParser from "../utils/htmlToMaterialUiParser";
import DescriptionIcon from "@material-ui/icons/Description";
import MapIcon from "@material-ui/icons/Map";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import clsx from "clsx";

import TextArea from "./TextArea";

import { Link } from "@material-ui/core";

const styles = theme => {
  return {
    documentImage: {
      cursor: "pointer",
      objectFit: "contain",
      objectPosition: "left"
    },
    naturalDocumentImageProportions: {
      width: "100%"
    },
    typography: {
      overflowWrap: "break-word"
    },
    linkIcon: {
      fontSize: theme.typography.body1.fontSize,
      marginRight: theme.spacing(0.5),
      verticalAlign: "middle"
    },
    linkText: {
      verticalAlign: "middle"
    },
    root: { minWidth: "32px", color: "black" },
    chapter: {
      cursor: "text",
      marginTop: theme.spacing(4)
    }
  };
};

class Contents extends React.PureComponent {
  state = {
    popupImage: null,
    activeContent: null
  };

  componentDidMount = () => {
    this.appendParsedComponentsToDocument();
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
      tagType: "ul",
      callback: this.getULComponent
    });
    allowedHtmlTags.push({
      tagType: "ol",
      callback: this.getOLComponent
    });
    allowedHtmlTags.push({
      tagType: "li",
      callback: () => {}
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
    allowedHtmlTags.push({
      tagType: "strong",
      callback: this.getStrongTagTypographyComponents
    });
    allowedHtmlTags.push({
      tagType: "u",
      callback: this.getUTagTypographyComponents
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
        if (subChapter.chapters.length > 0) {
          this.appendComponentsToChapter(subChapter);
        }
      });
    }
    chapter.components = this.getMaterialUIComponentsForChapter(chapter);
  };

  appendParsedComponentsToDocument = () => {
    const { activeDocument } = this.props;
    var content = { ...activeDocument };
    content.chapters.forEach((chapter, index) => {
      this.appendComponentsToChapter(chapter);
    });
    this.setState({ activeContent: content });
  };

  getULComponent = tag => {
    const { classes } = this.props;
    return (
      <List component="nav">
        {tag.text.map(listItem => {
          return (
            <ListItem>
              <ListItemIcon classes={{ root: classes.root }}>
                <FiberManualRecordIcon
                  style={{ fontSize: "1em" }}
                ></FiberManualRecordIcon>
              </ListItemIcon>
              <ListItemText primary={listItem.text}></ListItemText>
            </ListItem>
          );
        })}
      </List>
    );
  };

  getOLComponent = tag => {
    const { classes } = this.props;
    return (
      <List component="nav">
        {tag.text.map((listItem, index) => {
          return (
            <ListItem>
              <ListItemIcon classes={{ root: classes.root }}>{`${index +
                1}.`}</ListItemIcon>
              <ListItemText primary={listItem.text}></ListItemText>
            </ListItem>
          );
        })}
      </List>
    );
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

  getTextLinkTextFromHtmlObject = htmlObject => {
    return htmlObject.text;
  };

  getExternalLink = (aTagObject, externalLink) => {
    const { classes } = this.props;
    return (
      <Link href={externalLink} target="_blank" rel="noopener" variant="body2">
        <OpenInNewIcon className={classes.linkIcon}></OpenInNewIcon>
        <span className={classes.linkText}>{aTagObject.innerHTML}</span>
      </Link>
    );
  };

  getMapLink = (aTagObject, mapLink) => {
    const { localObserver, classes } = this.props;
    return (
      <Link
        href="#"
        variant="body2"
        component="button"
        onClick={() => {
          localObserver.publish("fly-to", mapLink);
        }}
      >
        <MapIcon className={classes.linkIcon}></MapIcon>
        <span className={classes.linkText}>{aTagObject.innerHTML}</span>
      </Link>
    );
  };

  getDocumentLink = (headerIdentifier, documentLink, text) => {
    const { localObserver, classes } = this.props;
    return (
      <>
        <Link
          href="#"
          component="button"
          underline="hover"
          variant="body1"
          onClick={() => {
            localObserver.publish("show-header-in-document", {
              documentName: documentLink,
              headerIdentifier: headerIdentifier
            });
          }}
        >
          <DescriptionIcon className={classes.linkIcon}></DescriptionIcon>
          <span className={classes.linkText}>{text}</span>
        </Link>
      </>
    );
  };

  getLinkDataPerType = attributes => {
    const {
      0: mapLink,
      1: headerIdentifier,
      2: documentLink,
      3: externalLink
    } = [
      "data-maplink",
      "data-header-identifier",
      "data-document",
      "data-link"
    ].map(attributeKey => {
      return this.getValueFromAttribute(attributes, attributeKey);
    });

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
    const attributes = this.getDataAttributesFromHtmlObject(blockQuote);
    const borderColor = this.getValueFromAttribute(
      attributes,
      "data-border-color"
    );
    const backgroundColor = this.getValueFromAttribute(
      attributes,
      "data-background-color"
    );

    return (
      <TextArea
        key={index}
        backgroundColor={backgroundColor}
        dividerColor={borderColor}
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
    const aTagObject = this.parseStringToHtmlObject(`<a ${aTag.text}</a>`, "a");
    const attributes = this.getDataAttributesFromHtmlObject(aTagObject);
    const text = this.getTextLinkTextFromHtmlObject(aTagObject);
    const {
      mapLink,
      headerIdentifier,
      documentLink,
      externalLink
    } = this.getLinkDataPerType(attributes);

    if (documentLink) {
      return this.getDocumentLink(headerIdentifier, documentLink, text);
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

  isPopupAllowedForImage = imageAttributes => {
    return imageAttributes
      .map(attribute => {
        return attribute.dataAttribute;
      })
      .includes("data-popup");
  };

  /**
   * The render function for the img-tag.
   * @param {string} imgTag The img-tag.
   *
   * @memberof Contents
   */
  getImgCardComponent = imgTag => {
    const imgTagObject = this.parseStringToHtmlObject(
      `<img ${imgTag.text}</img>`,
      "img"
    );
    const attributes = this.getDataAttributesFromHtmlObject(imgTagObject);

    const image = {
      caption: this.getValueFromAttribute(attributes, "data-caption"),
      popup: this.isPopupAllowedForImage(attributes),
      source: this.getValueFromAttribute(attributes, "data-source"),
      url: this.getValueFromAttribute(attributes, "src"),
      altValue: this.getValueFromAttribute(attributes, "alt"),
      height: this.getValueFromAttribute(attributes, "data-image-height"),
      width: this.getValueFromAttribute(attributes, "data-image-width")
    };
    const { classes } = this.props;
    var hasCustomProportions = image.height && image.width;
    var onClickCallback = image.popup
      ? () => {
          this.showPopupModal(image);
        }
      : null;

    return (
      <>
        <CardMedia
          onClick={onClickCallback}
          alt={image.altValue}
          component="img"
          style={
            hasCustomProportions
              ? { height: image.height, width: image.width }
              : null
          }
          className={
            hasCustomProportions
              ? classes.documentImage
              : clsx(
                  classes.documentImage,
                  classes.naturalDocumentImageProportions
                )
          }
          image={image.url}
        />
        {this.getImageDescription(image)}
      </>
    );
  };

  getImageDescription = image => {
    const { classes } = this.props;
    return (
      <>
        <Typography className={classes.typography} variant="subtitle2">
          {image.caption}
        </Typography>
        <Typography className={classes.typography} variant="subtitle2">
          {image.source}
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

    return (
      <Typography className={classes.typography} variant="body1">
        {pTag.text.map((element, index) => {
          if (element.tagType === null) {
            return element.text;
          }
          return (
            <React.Fragment key={index}>
              {element.renderCallback(element)}
            </React.Fragment>
          );
        })}
      </Typography>
    );
  };

  getStrongTagTypographyComponents = strongTag => {
    if (strongTag.renderCallback)
      return <strong>{strongTag.renderCallback}</strong>;

    return <strong>{strongTag.text}</strong>;
  };

  getUTagTypographyComponents = uTag => {
    return <u>{uTag.text}</u>;
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

  componentDidUpdate(nextProps) {
    const { activeDocument } = this.props;
    if (nextProps.activeDocument !== activeDocument) {
      this.appendParsedComponentsToDocument();
    }
  }

  closePopupModal = () => {
    this.setState({ popupImage: null });
  };

  showPopupModal = image => {
    this.setState({ popupImage: image });
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

  getHeaderVariant = chapter => {
    var headerSize = 2; //Chapters start with h2
    while (chapter.parent) {
      headerSize++;
      chapter = chapter.parent;
    }
    return `h${headerSize}`;
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
          variant={this.getHeaderVariant(chapter)}
        >
          {chapter.header}
        </Typography>
      </>
    );
  };

  render = () => {
    if (this.state.activeContent) {
      return (
        <>
          {this.renderImageInModal()}
          {this.renderChapters(this.state.activeContent.chapters)}
        </>
      );
    } else {
      return null;
    }
  };
}

export default withStyles(styles)(Contents);
