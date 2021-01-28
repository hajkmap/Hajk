import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import ImagePopupModal from "./ImagePopupModal";
import htmlToMaterialUiParser from "../utils/htmlToMaterialUiParser";
import { Box } from "@material-ui/core";
import {
  Paragraph,
  ULComponent,
  OLComponent,
  CustomLink,
  Figure,
  Heading,
  Strong,
  Italic,
  Underline,
  Img,
  BlockQuote,
  LineBreak,
} from "../utils/ContentComponentFactory";

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

  getUniqueIntegerNumber = () => {
    const id = this.internalIds.length + 1;
    this.internalIds.push(id);
    return id;
  };

  flattenChaptersTree = (chapters) => {
    return chapters.reduce((acc, chapter) => {
      if (chapter.html && chapter.header) {
        let chapterStrippedFromSubChapters = { ...chapter };
        chapterStrippedFromSubChapters.chapters = [];
        acc = [...acc, chapterStrippedFromSubChapters];
      }
      if (chapter.chapters && chapter.chapters.length > 0) {
        return [...acc, ...this.flattenChaptersTree(chapter.chapters)];
      }
      return acc;
    }, []);
  };

  componentDidMount = () => {
    const { localObserver } = this.props;
    this.appendParsedComponentsToDocument();
    localObserver.unsubscribe("append-chapter-components");
    localObserver.subscribe("image-popup", this.showPopupModal);
    localObserver.subscribe("append-chapter-components", (chapters) => {
      console.log(chapters, "chapters");
      chapters.forEach((chapter) => {
        this.appendComponentsToChapter(chapter);
      });

      let renderedChapters = this.renderChapters(
        this.flattenChaptersTree(chapters)
      );
      localObserver.publish("chapter-components-appended", renderedChapters);
    });
  };

  componentWillUnmount = () => {
    const { localObserver } = this.props;
    localObserver.unsubscribe("chapter-components-appended");
  };

  getCustomLink = (e) => {
    return (
      <CustomLink
        aTag={e}
        localObserver={this.props.localObserver}
        bottomMargin
      ></CustomLink>
    );
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
      callback: () => {
        return <LineBreak></LineBreak>;
      },
    });
    allowedHtmlTags.push({
      tagType: "ul",
      callback: (e) => {
        return <ULComponent ulComponent={e}></ULComponent>;
      },
    });
    allowedHtmlTags.push({
      tagType: "ol",
      callback: (e) => <OLComponent olComponent={e}></OLComponent>,
    });
    allowedHtmlTags.push({
      tagType: "li",
      callback: () => {},
    });
    allowedHtmlTags.push({
      tagType: "blockquote",
      callback: (e) => {
        return (
          <BlockQuote
            blockQuoteTag={e}
            defaultColors={this.props.options.defaultDocumentColorSettings}
          ></BlockQuote>
        );
      },
    });
    allowedHtmlTags.push({
      tagType: "h1",
      callback: (e) => {
        return <Heading headingTag={e}></Heading>;
      },
    });
    allowedHtmlTags.push({
      tagType: "h2",
      callback: (e) => {
        return <Heading headingTag={e}></Heading>;
      },
    });
    allowedHtmlTags.push({
      tagType: "h3",
      callback: (e) => {
        return <Heading headingTag={e}></Heading>;
      },
    });
    allowedHtmlTags.push({
      tagType: "h4",
      callback: (e) => {
        return <Heading headingTag={e}></Heading>;
      },
    });
    allowedHtmlTags.push({
      tagType: "h5",
      callback: (e) => {
        return <Heading headingTag={e}></Heading>;
      },
    });
    allowedHtmlTags.push({
      tagType: "h6",
      callback: (e) => {
        return <Heading headingTag={e}></Heading>;
      },
    });
    allowedHtmlTags.push({
      tagType: "a",
      callback: this.getCustomLink.bind(this),
    });
    allowedHtmlTags.push({
      tagType: "img",
      callback: (e) => {
        return (
          <Img
            getUniqueIntegerNumber={this.getUniqueIntegerNumber}
            imgTag={e}
            localObserver={this.props.localObserver}
          ></Img>
        );
      },
    });
    allowedHtmlTags.push({
      tagType: "p",
      callback: (e) => {
        return <Paragraph pTag={e}></Paragraph>;
      },
    });
    allowedHtmlTags.push({
      tagType: "figure",
      callback: (e) => {
        return <Figure figureTag={e}></Figure>;
      },
    });
    allowedHtmlTags.push({
      tagType: "strong",
      callback: (e) => {
        return <Strong strongTag={e}></Strong>;
      },
    });
    allowedHtmlTags.push({
      tagType: "u",
      callback: (e) => {
        return <Underline uTag={e}></Underline>;
      },
    });
    allowedHtmlTags.push({
      tagType: "em",
      callback: (e) => {
        return <Italic emTag={e}></Italic>;
      },
    });
    return allowedHtmlTags;
  };

  getMaterialUIComponentsForChapter = (chapter) => {
    return htmlToMaterialUiParser(
      chapter.html,
      this.getTagSpecificCallbacks()
    ).map((component, index) => {
      return <React.Fragment key={index}>{component}</React.Fragment>;
    });
  };

  hasSubChapters = (chapter) => {
    return chapter.chapters && chapter.chapters.length > 0;
  };

  appendComponentsToChapter = (chapter) => {
    if (this.hasSubChapters(chapter)) {
      chapter.chapters.forEach((subChapter) => {
        subChapter.components = this.getMaterialUIComponentsForChapter(
          subChapter
        );
        if (this.hasSubChapters(subChapter)) {
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
        <Box style={{ display: "block", maxWidth: "100%" }}>
          {this.renderImageInModal()}
          {this.renderChapters(this.state.activeContent.chapters)}
        </Box>
      );
    } else {
      return null;
    }
  };
}

export default withStyles(styles)(Contents);
