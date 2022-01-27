import React from "react";
import Typography from "@mui/material/Typography";
import ImagePopupModal from "./ImagePopupModal";
import { flattenChaptersTree } from "../utils/helpers";
import { Box } from "@mui/material";

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

          renderedChapters.push(this.renderChapters(flatChaptersTree, true));
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
    return (
      <Typography key={id} data-type="chapter-header" variant="h1">
        {title}
      </Typography>
    );
  };

  /**
   * Renders the document with all it's chapters and sub chapters.
   * @param {object} document The document that will be rendered.
   *
   * @memberof Contents
   */
  renderChapters = (chapters, isPrintMode) => {
    return Array.isArray(chapters)
      ? chapters.map((chapter) => this.renderChapter(chapter, isPrintMode))
      : null;
  };

  /**
   * Renders a chapter with a headline an a content.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderChapter = (chapter, isPrintMode) => {
    return (
      <React.Fragment key={chapter.id}>
        {this.renderHeadline(chapter, isPrintMode)}
        {chapter.components}
        {Array.isArray(chapter.chapters)
          ? chapter.chapters.map((subChapter) => this.renderChapter(subChapter))
          : null}
      </React.Fragment>
    );
  };

  getHeaderVariant = (chapter, isPrintMode) => {
    let headerSize = 2; //Chapters start with h2

    //If we are printing, we have a flattened chapters tree, so use the chapter.level property to set the heading
    //instead of cycling through the parent chapter objects.
    if (isPrintMode) {
      headerSize += chapter.level;
      return `h${headerSize}`;
    }
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
  renderHeadline = (chapter, isPrintMode) => {
    return (
      <>
        <Typography
          ref={chapter.scrollRef}
          sx={{ overflowWrap: "break-word" }}
          data-type="chapter-header"
          variant={this.getHeaderVariant(chapter, isPrintMode)}
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

export default Contents;
