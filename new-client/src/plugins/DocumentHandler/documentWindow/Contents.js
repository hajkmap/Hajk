import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import ImagePopupModal from "./ImagePopupModal";
import { flattenChaptersTree } from "../utils/helpers";
import { Box } from "@material-ui/core";

const styles = (theme) => {
  return {
    typography: {
      overflowWrap: "break-word",
    },
    chapter: {
      cursor: "text",
      display: "block",
    },
  };
};

class Contents extends React.PureComponent {
  state = {
    popupImage: null,
    activeContent: null,
  };

  constructor(props) {
    super(props);
    this.internalIds = [];
  }

  /* TODO...
   * This should be refactored in some other way.
   * right now we are "creating" components for printing here
   * because we need to use the render in this component
   */
  bindPrintSpecificHandlers = () => {
    const { localObserver, model } = this.props;
    localObserver.unsubscribe("append-chapter-components");

    localObserver.subscribe("append-document-components", (documents) => {
      let chapters = [];
      let headerChapter = [];

      documents.forEach((document) => {
        /*
         * add an H1 tag for menu parents when printing.
         * chapters if a group of documents has a parent document, the header of the parent
         * is printed if any of the children are printed.
         */
        if (document.isGroupHeader) {
          headerChapter.push(
            this.createGroupHeadingTag(document.title, document.id)
          );
          chapters.push(headerChapter);
          headerChapter = [];
        } else {
          document.chapters.forEach((chapter) => {
            model.appendComponentsToChapter(chapter);
          });

          let renderedChapters = [];
          let flatChaptersTree = flattenChaptersTree(document.chapters);
          flatChaptersTree = flatChaptersTree.map((item) => {
            if (item.mustReplace) {
              let newItem = {};
              item = newItem;
            }
            return item;
          });

          renderedChapters.push(this.renderChapters(flatChaptersTree));
          chapters.push(renderedChapters);
        }
      });

      localObserver.publish("chapter-components-appended", chapters);
    });
  };

  componentDidMount = () => {
    const { localObserver } = this.props;
    this.bindPrintSpecificHandlers();
    localObserver.subscribe("image-popup", this.showPopupModal);
  };

  componentWillUnmount = () => {
    const { localObserver } = this.props;
    localObserver.unsubscribe("chapter-components-appended");
  };

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

  createGroupHeadingTag = (title, id) => {
    const { classes } = this.props;
    return (
      <React.Fragment key={id}>
        <Typography
          className={classes.typography}
          data-type="chapter-header"
          variant={"h2"}
          component={"h1"}
        >
          {title}
        </Typography>
      </React.Fragment>
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
    return (
      <React.Fragment key={chapter.id}>
        {this.renderHeadline(chapter)}
        {chapter.components}
        {Array.isArray(chapter.chapters)
          ? chapter.chapters.map((subChapter) => this.renderChapter(subChapter))
          : null}
      </React.Fragment>
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
          data-type="chapter-header"
          variant={this.getHeaderVariant(chapter)}
        >
          {chapter.header}
        </Typography>
      </>
    );
  };

  render = () => {
    if (this.props.activeDocument) {
      return (
        <Box style={{ display: "block", maxWidth: "100%" }}>
          {this.renderImageInModal()}
          {this.renderChapters(this.props.activeDocument.chapters)}
        </Box>
      );
    } else {
      return null;
    }
  };
}

export default withStyles(styles)(Contents);
