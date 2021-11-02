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
      console.log("CREATING CONTENTS");
      console.log("documents: ", documents);
      //temporarily filter away the heading documents so we can see how chapters works:
      //documents = documents.filter((doc) => !doc.isGroupHeader);
      console.log(documents);

      let chapters = [];

      //debugger;
      let headerChapter = [];

      documents.forEach((document) => {
        if (document.isGroupHeader) {
          // headerChapter.push(
          //   model.returnChapterHeader(document.title, document.id)
          // );
          // chapters.push(headerChapter);
        } else {
          document.chapters.forEach((chapter) => {
            model.appendComponentsToChapter(chapter);
          });

          let renderChapters = [];
          if (headerChapter.length > 0) {
            chapters.push(headerChapter);
            headerChapter = [];
          }

          let flatChaptersTree = flattenChaptersTree(document.chapters);
          // if (document.title === "Utvecklingsinriktning - Genomförande") {
          //   debugger;
          // }
          flatChaptersTree = flatChaptersTree.map((item) => {
            if (item.mustReplace) {
              let newItem = {};
              newItem.header = item.header;
              //newItem.components = [];
              //let newItem = [];
              // newItem.components.push(
              //   model.returnChapterHeader(item.header, item.headerIdentifier)
              // );
              item = newItem;
            }
            return item;
          });
          // if (flatChaptersTree.length === 0) {
          //   flatChaptersTree.push(model.returnChapterHeader())
          // }
          console.log(flatChaptersTree);
          renderChapters.push(this.renderChapters(flatChaptersTree));

          console.log(renderChapters);
          chapters.push(renderChapters);
        }
      });
      console.log(chapters);

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
    // if (chapter.header === "Genomförande") {
    //   debugger;
    // }
    console.log(chapter);
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
    // if (document.title === "Utvecklingsinriktning - Genomförande") {
    //   debugger;
    // }
    // if (chapter.header === "Genomförande") {
    //   debugger;
    // }
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
