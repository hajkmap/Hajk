import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Card from "@material-ui/core/Card";
import CardMedia from "@material-ui/core/CardMedia";
import CustomModal from "./CustomModal";
import htmlToMaterialUiParser from "../utils/htmlToMaterialUiParser";

const styles = theme => {
  return {
    cardMedia: { height: "200px", width: "auto", objectFit: "contain" },
    typography: {
      paddingRight: theme.spacing(1),
      paddingLeft: theme.spacing(1)
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

  closePopupImageModal = () => {
    this.setState({ popupImage: null });
  };

  renderImageInModal = () => {
    return (
      <CustomModal
        fullScreen={false}
        close={this.closePopupImageModal}
        open={this.state.popupImage ? true : false}
      >
        <CardMedia
          style={{ margin: "auto" }}
          component="img"
          image={this.state.popupImage}
        />
      </CustomModal>
    );
  };

  showPopup = imageSource => {
    this.setState({ popupImage: imageSource });
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
        <Paper elevation={0} style={{ height: "10px" }} /> {/*What is this*/}
        <Card elevation={0}>
          <CardMedia
            onClick={() => {
              this.showPopup(imageSource);
            }}
            component="img"
            className={classes.cardMedia}
            image={imageSource}
          />
        </Card>
        <Typography className={classes.typography} variant="subtitle2">
          Lägg till bildtext här
        </Typography>
        <Typography className={classes.typography} variant="subtitle2">
          Lägg till källa/fotograf här
        </Typography>
        <Paper elevation={0} style={{ height: "20px" }} />
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
    allowedHtmlTags.push({ tagType: "img", callback: this.getTagImgCard });
    allowedHtmlTags.push({ tagType: "p", callback: this.getPtagTypography });
    return allowedHtmlTags;
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
    console.log(chapter.id, "id");
    return (
      <Grid container alignItems="center" key={chapter.id}>
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

    if (chapter.parent === undefined)
      return (
        <Typography
          ref={chapter.scrollRef}
          className={classes.typography}
          variant="h1"
        >
          {chapter.header}
        </Typography>
      );

    return (
      <>
        <Paper elevation={0} style={{ height: "30px" }} /> {/*What is this*/}
        <Typography
          ref={chapter.scrollRef}
          className={classes.typography}
          variant="h2"
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
