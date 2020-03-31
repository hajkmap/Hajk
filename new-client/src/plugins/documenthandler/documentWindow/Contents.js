import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import CardMedia from "@material-ui/core/CardMedia";
import CustomModal from "./CustomModal";
import htmlToMaterialUiParser from "../utils/htmlToMaterialUiParser";
import { Link } from "@material-ui/core";

const styles = theme => {
  return {
    documentImage: {
      height: "300px",
      cursor: "pointer",
      width: "100%",
      objectFit: "contain"
    },
    modalImage: {
      width: "100%",
      objectFit: "contain"
    },

    chapter: {
      userSelect: "text",
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
   * Constructor for the contents which renders all chapters in the document.
   * @param {object} props Contains the document that holds all chapters.
   *
   * @memberof Contents
   */
  constructor(props) {
    super(props);
    this.document = this.props.document;
  }

  /**
   * Private help method that adds all allowed html tags.
   *
   * @memberof Contents
   */
  getTagSpecificCallbacks = () => {
    let allowedHtmlTags = [];
    allowedHtmlTags.push({ tagType: "br", callback: this.getBrtagTypography });
    allowedHtmlTags.push({
      tagType: "h1",
      callback: this.getHeadingTypography
    });
    allowedHtmlTags.push({
      tagType: "h2",
      callback: this.getHeadingTypography
    });
    allowedHtmlTags.push({
      tagType: "h3",
      callback: this.getHeadingTypography
    });
    allowedHtmlTags.push({
      tagType: "h4",
      callback: this.getHeadingTypography
    });
    allowedHtmlTags.push({
      tagType: "h5",
      callback: this.getHeadingTypography
    });
    allowedHtmlTags.push({
      tagType: "h6",
      callback: this.getHeadingTypography
    });
    allowedHtmlTags.push({
      tagType: "a",
      callback: this.getLink
    });
    allowedHtmlTags.push({ tagType: "img", callback: this.getTagImgCard });
    allowedHtmlTags.push({ tagType: "p", callback: this.getPtagTypography });
    return allowedHtmlTags;
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

  /**
   * Callback used to render different link-components from a-elements
   * @param {Element} htmlObject a-element.
   * @param {Function} clickHandler callback to run when link is clicked
   * @returns {<Link>} Returns materialUI component <Link>
   *
   * @memberof Contents
   */
  getLinkComponent = (htmlObject, clickHandler) => {
    return (
      <Link href="#" variant="body2" onClick={clickHandler}>
        {htmlObject.innerHTML}
      </Link>
    );
  };

  /**
   * Callback used to render different link-components from a-elements
   * @param {Element} aTag a-element.
   * @returns {<Link>} Returns materialUI component <Link>
   *
   * @memberof Contents
   */
  getLink = aTag => {
    const { localObserver, model } = this.props;
    const aTagObject = this.parseStringToHtmlObject(aTag.tagValue, "a");
    const attributes = this.getDataAttributesFromHtmlObject(aTagObject);
    const {
      mapLink,
      headerIdentifier,
      documentLink,
      externalLink
    } = this.getLinkDataPerType(attributes);

    if (headerIdentifier) {
      if (documentLink) {
        return this.getLinkComponent(aTagObject, () => {
          localObserver.publish("show-document-window", {
            documentName: documentLink,
            headerIdentifier: headerIdentifier
          });
        });
      } else {
        return this.getLinkComponent(aTagObject, () => {
          localObserver.publish(
            "scroll-to",
            model.getHeaderRef(this.props.document, headerIdentifier)
          );
        });
      }
    }

    if (mapLink) {
      return this.getLinkComponent(aTagObject, () => {
        localObserver.publish("fly-to", mapLink);
      });
    }

    if (externalLink) {
      return (
        <Link
          href={externalLink}
          target="_blank"
          rel="noopener"
          variant="body2"
        >
          {aTagObject.innerHTML}
        </Link>
      );
    }
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
   * The render function for the img-tag.
   * @param {string} imgTag The img-tag.
   *
   * @memberof Contents
   */
  getTagImgCard = imgTag => {
    const { classes } = this.props;
    const indexOfSrcMaterial = imgTag.tagValue.indexOf("=") + 2;
    let imageSource = imgTag.tagValue.substring(
      indexOfSrcMaterial,
      imgTag.tagValue.length - 3
    );
    return (
      <>
        <CardMedia
          onClick={() => {
            this.showPopupModal(imageSource);
          }}
          component="img"
          className={classes.documentImage}
          image={imageSource}
        />
        <Typography className={classes.typography} variant="subtitle2">
          Lägg till bildtext här
        </Typography>
        <Typography className={classes.typography} variant="subtitle2">
          Lägg till källa/fotograf här
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
  getPtagTypography = pTag => {
    const { classes } = this.props;
    let textToRender = pTag.tagValue.substring(3, pTag.tagValue.length - 4);
    return (
      <Typography className={classes.typography} variant="body1">
        {textToRender}
      </Typography>
    );
  };

  /**
   * The render function for the br-tag.
   * @param {string} brTag The br-tag.
   *
   * @memberof htmlToMaterialUiParser
   */
  getBrtagTypography = brTag => {
    return <Paper elevation={0} style={{ height: "20px" }} />;
  };

  getHeadingTypography = tag => {
    const { classes } = this.props;
    let textToRender = tag.tagValue.substring(4, tag.tagValue.length - 5);
    return (
      <Typography className={classes.typography} variant={tag.tagType}>
        {textToRender}
      </Typography>
    );
  };

  closePopupModal = () => {
    this.setState({ popupImage: null });
  };

  showPopupModal = imageSource => {
    this.setState({ popupImage: imageSource });
  };

  renderImageInModal = () => {
    const { classes } = this.props;
    return (
      <CustomModal
        fullScreen={false}
        close={this.closePopupModal}
        open={this.state.popupImage ? true : false}
      >
        <CardMedia
          component="img"
          className={classes.modalImage}
          image={this.state.popupImage}
        />
      </CustomModal>
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
        alignItems="center"
        key={chapter.id}
      >
        <Grid item xs={12}>
          {this.renderHeadline(chapter)}
        </Grid>
        <Grid item xs={12}>
          {this.renderContents(chapter)}
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
          variant={chapter.parent ? "h2" : "h1"}
        >
          {chapter.header}
        </Typography>
      </>
    );
  };

  /**
   * Render all the contents.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderContents = chapter => {
    return htmlToMaterialUiParser(
      chapter.html,
      this.getTagSpecificCallbacks()
    ).map((component, index) => {
      console.log(component, "component");
      return <React.Fragment key={index}>{component}</React.Fragment>;
    });
  };

  render() {
    const { document } = this.props;
    const { popupImage } = this.state;
    return (
      <>
        {popupImage && this.renderImageInModal()}
        {this.renderChapters(document?.chapters)};
      </>
    );
  }
}

export default withStyles(styles)(Contents);
