import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardMedia from "@material-ui/core/CardMedia";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import htmlToMaterialUiParser from "../utils/htmlToMaterialUiParser";

const styles = theme => {
  return {};
};

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
  }

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
    return (
      <Grid container key={chapter.id}>
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
    return <Typography variant="h4">{chapter.header}</Typography>;
  };

  /**
   * Render all the contents.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderContents = chapter => {
    return htmlToMaterialUiParser(chapter.html).map((component, index) => {
      return <React.Fragment key={index}>{component}</React.Fragment>;
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
    return this.renderChapters(document?.chapters);
  }
}

export default withStyles(styles)(Contents);
