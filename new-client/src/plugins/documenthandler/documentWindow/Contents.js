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
import Link from "@material-ui/core/Link";

const getIconSizeFromFontSize = (theme) => {
  let fontSizeBody = theme.typography.body1.fontSize;
  let format = "rem";
  if (fontSizeBody.search("px") > -1) {
    format = "px";
  }
  let index = fontSizeBody.search(format);
  let size = fontSizeBody.substring(0, index);
  return `${size * 1.7}${format}`;
};

const styles = (theme) => {
  return {
    documentImage: {
      objectFit: "contain",
      objectPosition: "left",
    },
    popupActivatedImage: {
      cursor: "pointer",
    },
    naturalDocumentImageProportions: {
      width: "100%",
    },
    linkButton: {
      display: "flex",
      textAlign: "left",
      alignItems: "center",
    },
    typography: {
      overflowWrap: "break-word",
    },
    linkIcon: {
      fontSize: getIconSizeFromFontSize(theme),
      marginRight: theme.spacing(0.5),
      verticalAlign: "middle",
    },
    listRoot: {
      maxWidth: theme.spacing(3),
      minWidth: theme.spacing(3),
      color: "black",
    },
    chapter: {
      cursor: "text",
      marginTop: theme.spacing(4),
    },
  };
};

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

class Contents extends React.PureComponent {
  state = {
    popupImage: null,
    activeContent: null,
  };

  componentDidMount = () => {
    this.appendParsedComponentsToDocument();
    this.props.localObserver.unsubscribe("append-chapter-components");
    this.props.localObserver.subscribe(
      "append-chapter-components",
      (chapters) => {
        chapters.forEach((chapter) => {
          this.appendComponentsToChapter(chapter);
        });
        let renderedChapters = this.renderChapters(chapters);
        this.props.localObserver.publish(
          "chapter-components-appended",
          renderedChapters
        );
      }
    );
  };

  componentWillUnmount = () => {
    this.props.localObserver.unsubscribe("chapter-components-appended");
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
      callback: this.getBrtagTypographyComponent,
    });
    allowedHtmlTags.push({
      tagType: "ul",
      callback: this.getULComponent,
    });
    allowedHtmlTags.push({
      tagType: "ol",
      callback: this.getOLComponent,
    });
    allowedHtmlTags.push({
      tagType: "li",
      callback: () => {},
    });
    allowedHtmlTags.push({
      tagType: "blockquote",
      callback: this.getBlockQuoteComponents,
    });
    allowedHtmlTags.push({
      tagType: "h1",
      callback: this.getHeadingTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "h2",
      callback: this.getHeadingTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "h3",
      callback: this.getHeadingTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "h4",
      callback: this.getHeadingTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "h5",
      callback: this.getHeadingTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "h6",
      callback: this.getHeadingTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "a",
      callback: this.getLinkComponent,
    });
    allowedHtmlTags.push({
      tagType: "img",
      callback: this.getImgCardComponent,
    });
    allowedHtmlTags.push({
      tagType: "p",
      callback: this.getPtagTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "figure",
      callback: this.getFigureComponents,
    });
    allowedHtmlTags.push({
      tagType: "strong",
      callback: this.getStrongTagTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "u",
      callback: this.getUnderlineTagTypographyComponents,
    });
    allowedHtmlTags.push({
      tagType: "em",
      callback: this.getItalicTagTypographyComponents,
    });
    return allowedHtmlTags;
  };

  getStrongTagTypographyComponents = (strongTag) => {
    const children = [...strongTag.childNodes];
    let array = [];
    if (children.length > 0) {
      children.forEach((child, index) => {
        array.push(
          <React.Fragment key={index}>
            <strong>{this.renderChild(child)}</strong>
          </React.Fragment>
        );
      });
      return array;
    }
    return [<strong>{strongTag.textContent}</strong>];
  };
  getUnderlineTagTypographyComponents = (uTag) => {
    const children = [...uTag.childNodes];
    let array = [];
    if (children.length > 0) {
      children.forEach((child, index) => {
        array.push(
          <React.Fragment key={index}>
            <u>{this.renderChild(child)}</u>
          </React.Fragment>
        );
      });
      return array;
    }
    return [<u>{uTag.textContent}</u>];
  };
  getItalicTagTypographyComponents = (emTag) => {
    const children = [...emTag.childNodes];
    let array = [];
    if (children.length > 0) {
      children.forEach((child, index) => {
        array.push(
          <React.Fragment key={index}>
            <em>{this.renderChild(child)}</em>
          </React.Fragment>
        );
      });
      return array;
    }
    return [<em>{emTag.textContent}</em>];
  };

  getMaterialUIComponentsForChapter = (chapter) => {
    return htmlToMaterialUiParser(
      chapter.html,
      this.getTagSpecificCallbacks()
    ).map((component, index) => {
      return <React.Fragment key={index}>{component}</React.Fragment>;
    });
  };

  appendComponentsToChapter = (chapter) => {
    if (chapter.chapters && chapter.chapters.length > 0) {
      chapter.chapters.forEach((subChapter) => {
        subChapter.components = this.getMaterialUIComponentsForChapter(
          subChapter
        );
        if (subChapter.chapters && subChapter.chapters.length > 0) {
          this.appendComponentsToChapter(subChapter);
        }
      });
    }
    chapter.components = this.getMaterialUIComponentsForChapter(chapter);
  };

  appendParsedComponentsToDocument = () => {
    const { activeDocument } = this.props;
    let content = { ...activeDocument };
    content.chapters.forEach((chapter, index) => {
      this.appendComponentsToChapter(chapter);
    });
    this.setState({ activeContent: content });
  };

  renderChild = (child) => {
    if (child.nodeType === TEXT_NODE) {
      return child.data;
    }

    if (child.nodeType === ELEMENT_NODE) {
      return child.callback(child);
    }
  };

  getULComponent = (ulComponent) => {
    const { classes } = this.props;
    let children = [...ulComponent.children];
    return (
      <List component="nav">
        {children.map((listItem, index) => {
          return (
            <ListItem key={index}>
              <ListItemIcon classes={{ root: classes.listRoot }}>
                <FiberManualRecordIcon
                  style={{ fontSize: "1em" }}
                ></FiberManualRecordIcon>
              </ListItemIcon>
              <ListItemText
                primary={this.getFormattedComponentFromTag(listItem)}
              ></ListItemText>
            </ListItem>
          );
        })}
      </List>
    );
  };

  getOLComponent = (olComponent) => {
    const { classes } = this.props;
    let children = [...olComponent.children];
    return (
      <List component="nav">
        {children.map((listItem, index) => {
          return (
            <ListItem key={index}>
              <ListItemText
                classes={{ root: classes.listRoot }}
                primary={`${index + 1}.`}
              ></ListItemText>
              <ListItemText
                primary={this.getFormattedComponentFromTag(listItem)}
              ></ListItemText>
            </ListItem>
          );
        })}
      </List>
    );
  };

  getExternalLink = (aTag, externalLink) => {
    const { classes } = this.props;
    return (
      <Link
        href={externalLink}
        target="_blank"
        className={classes.linkButton}
        rel="noopener"
        variant="body2"
      >
        <OpenInNewIcon className={classes.linkIcon}></OpenInNewIcon>
        {this.getFormattedComponentFromTag(aTag)}
      </Link>
    );
  };

  getMapLink = (aTag, mapLink) => {
    const { localObserver, classes } = this.props;
    return (
      <Link
        href="#"
        variant="body2"
        component="button"
        className={classes.linkButton}
        onClick={() => {
          localObserver.publish("fly-to", mapLink);
        }}
      >
        <MapIcon className={classes.linkIcon}></MapIcon>
        {this.getFormattedComponentFromTag(aTag)}
      </Link>
    );
  };

  getDocumentLink = (headerIdentifier, documentLink, aTag) => {
    const { localObserver, classes } = this.props;
    return (
      <>
        <Link
          href="#"
          component="button"
          underline="hover"
          variant="body1"
          className={classes.linkButton}
          onClick={() => {
            localObserver.publish("set-active-document", {
              documentName: documentLink,
              headerIdentifier: headerIdentifier,
            });
          }}
        >
          <DescriptionIcon className={classes.linkIcon}></DescriptionIcon>
          {this.getFormattedComponentFromTag(aTag)}
        </Link>
      </>
    );
  };

  getLinkDataPerType = (attributes) => {
    const {
      0: mapLink,
      1: headerIdentifier,
      2: documentLink,
      3: externalLink,
    } = [
      "data-maplink",
      "data-header-identifier",
      "data-document",
      "data-link",
    ].map((attributeKey) => {
      return attributes.getNamedItem(attributeKey)?.value;
    });

    return { mapLink, headerIdentifier, documentLink, externalLink };
  };

  getTextArea = (tag) => {
    const children = [...tag.childNodes];
    let textAreaContentArray = children.map((element, index) => {
      return (
        <React.Fragment key={index}>{this.renderChild(element)}</React.Fragment>
      );
    });

    const backgroundColor = tag.attributes.getNamedItem("data-background-color")
      ?.value;
    const dividerColor = tag.attributes.getNamedItem("data-divider-color")
      ?.value;

    return (
      <TextArea
        backgroundColor={backgroundColor}
        dividerColor={dividerColor}
        textAreaContentArray={textAreaContentArray}
      ></TextArea>
    );
  };

  getBlockQuoteComponents = (tag) => {
    if (tag.attributes.getNamedItem("data-text-section")) {
      return this.getTextArea(tag);
    } else {
      return null;
    }
  };

  /**
   * Callback used to render different link-components from a-elements
   * @param {Element} aTag a-element.
   * @returns {<Link>} Returns materialUI component <Link>
   *
   * @memberof Contents
   */
  getLinkComponent = (aTag) => {
    const {
      mapLink,
      headerIdentifier,
      documentLink,
      externalLink,
    } = this.getLinkDataPerType(aTag.attributes);

    if (documentLink) {
      return this.getDocumentLink(headerIdentifier, documentLink, aTag);
    }

    if (mapLink) {
      return this.getMapLink(aTag, mapLink);
    }

    if (externalLink) {
      return this.getExternalLink(aTag, externalLink);
    }
  };

  getFigureComponents = (figureTag) => {
    const children = [...figureTag.children];

    return children.map((element, index) => {
      return (
        <React.Fragment key={index}>{element.callback(element)}</React.Fragment>
      );
    });
  };

  isPopupAllowedForImage = (imgTag) => {
    return imgTag.attributes.getNamedItem("data-popup") == null ? false : true;
  };

  getImageStyle = (image) => {
    const { classes } = this.props;
    let className = image.popup
      ? clsx(
          classes.documentImage,
          classes.naturalDocumentImageProportions,
          classes.popupActivatedImage
        )
      : clsx(classes.documentImage, classes.naturalDocumentImageProportions);

    if (image.height && image.width) {
      if (image.popup) {
        className = clsx(classes.documentImage, classes.popupActivatedImage);
      } else {
        className = clsx(classes.documentImage, classes.popupActivatedImage);
      }
    }
    return className;
  };

  /**
   * The render function for the img-tag.
   * @param {string} imgTag The img-tag.
   *
   * @memberof Contents
   */
  getImgCardComponent = (imgTag) => {
    const image = {
      caption: imgTag.attributes.getNamedItem("data-caption")?.value,
      popup: this.isPopupAllowedForImage(imgTag),
      source: imgTag.attributes.getNamedItem("data-source")?.value,
      url: imgTag.attributes.getNamedItem("src")?.value,
      altValue: imgTag.attributes.getNamedItem("alt")?.value,
      height: imgTag.attributes.getNamedItem("data-image-height")?.value,
      width: imgTag.attributes.getNamedItem("data-image-width")?.value,
    };

    let onClickCallback = image.popup
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
            image.height && image.width
              ? { height: image.height, width: image.width }
              : null
          }
          className={this.getImageStyle(image)}
          image={image.url}
        />
        {this.getImageDescription(image)}
      </>
    );
  };

  getImageDescription = (image) => {
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

  getFormattedComponentFromTag = (tag) => {
    const childNodes = [...tag.childNodes];
    return childNodes.map((child, index) => {
      return (
        <React.Fragment key={index}>{this.renderChild(child)}</React.Fragment>
      );
    });
  };

  /**
   * The render function for the p-tag.
   * @param {string} pTag The p-tag.
   *
   * @memberof Contents
   */
  getPtagTypographyComponents = (pTag) => {
    const { classes } = this.props;
    return (
      <Typography className={classes.typography} variant="body1">
        {this.getFormattedComponentFromTag(pTag)}
      </Typography>
    );
  };

  /**
   * The render function for the br-tag.
   * @param {string} brTag The br-tag.
   *
   * @memberof htmlToMaterialUiParser
   */
  getBrtagTypographyComponent = () => {
    return <br />;
  };

  getHeadingTypographyComponents = (tag) => {
    const { classes } = this.props;
    return (
      <>
        <Typography
          className={classes.typography}
          variant={tag.tagName.toLowerCase()}
        >
          {this.getFormattedComponentFromTag(tag)}
        </Typography>
      </>
    );
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

  showPopupModal = (image) => {
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
  renderChapters = (chapters) => {
    return Array.isArray(chapters)
      ? chapters.map((chapter) => this.renderChapter(chapter))
      : null;
  };

  /**
   * Renders a chapter with a headline an a content.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderChapter = (chapter) => {
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
          ? chapter.chapters.map((subChapter) => this.renderChapter(subChapter))
          : null}
      </Grid>
    );
  };

  getHeaderVariant = (chapter) => {
    let headerSize = 2; //Chapters start with h2
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
  renderHeadline = (chapter) => {
    const { classes } = this.props;

    return (
      <>
        <Typography
          ref={chapter.scrollRef}
          className={classes.typography}
          id="chapter-header"
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
