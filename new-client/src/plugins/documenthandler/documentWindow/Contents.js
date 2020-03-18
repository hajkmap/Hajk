import React from "react";
import { withStyles } from "@material-ui/core/styles";
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
    return (
      <>
        {Array.isArray(chapters)
          ? chapters.map(chapter => this.renderChapter(chapter))
          : null}
      </>
    );
  };

  /**
   * Renders a chapter with a headline an a content.
   * @param {object} chapter The chapter to be rendered.
   *
   * @memberof Contents
   */
  renderChapter = chapter => {
    return (
      <>
        <Grid item xs={12}>
          {this.renderHeadline(chapter)}
        </Grid>
        <Grid item xs={12}>
          {this.renderContents(chapter)}
        </Grid>
        {Array.isArray(chapter.chapters)
          ? chapter.chapters.map(subChapter => this.renderChapter(subChapter))
          : null}
      </>
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
    return htmlToMaterialUiParser(chapter.html);
  };

  render() {
    const { document } = this.props;
    return <>{this.renderChapters(document?.chapters)}</>;
  }
}

export default withStyles(styles)(Contents);
