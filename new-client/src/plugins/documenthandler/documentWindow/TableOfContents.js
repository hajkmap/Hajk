import React from "react";
import { withStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";

const styles = theme => {
  return {
    tableOfContentsHeader: {
      paddingLeft: 0,
      paddingRight: 0
    },
    selectableText: {
      userSelect: "text"
    }
  };
};

class TableOfContents extends React.PureComponent {
  state = {};

  static propTypes = {};

  /**
   * Constructor for the table of contents which renders from all chapters in the document.
   * @param {object} document The document that holds all chapters.
   *
   * @memberof TableOfContents
   */
  constructor(props) {
    super(props);
    this.document = this.props.document;
  }

  /**
   * Render all chapters of the document.
   * @param {Array} document An array with all chapters of the document.
   *
   * @memberof TableOfContents
   */
  renderChapters = document => {
    let mainChapter = 0;
    return (
      <>
        {Array.isArray(document?.chapters)
          ? document.chapters.map(chapter =>
              this.renderSubChapters(chapter, 0, (++mainChapter).toString())
            )
          : null}
      </>
    );
  };

  linkClick = chapter => {
    const { localObserver } = this.props;
    localObserver.publish("scroll-to", chapter);
  };

  /**
   * Private help method that recursive renders all sub chapters of a chapter.
   * @param {object} chapter A chapter with all it's sub chapters that will be rendered.
   * @param {string} level A recursive level that help with the table construction.
   * @param {number} subChapterNumber A counter of the current sub chapter number
   *
   * @memberof TableOfContents
   */
  renderSubChapters = (chapter, level, subChapterNumber) => {
    let newLevel = level + 1;
    let number = 0;
    return (
      <Grid container key={subChapterNumber}>
        {level > 0 ? <Grid item xs={level}></Grid> : null}
        <Grid item xs={12 - level}>
          <Link
            href="#"
            variant="h4"
            underline="hover"
            onClick={() => {
              this.linkClick(chapter);
            }}
          >
            {subChapterNumber + " " + chapter.header}
          </Link>
        </Grid>

        {Array.isArray(chapter.chapters)
          ? chapter.chapters.map(subChapter =>
              this.renderSubChapters(
                subChapter,
                newLevel,
                subChapterNumber.concat("." + ++number)
              )
            )
          : null}
      </Grid>
    );
  };

  render() {
    const { classes, document } = this.props;
    return (
      <ExpansionPanel
        elevation={0}
        className={classes.tableOfContents}
        defaultExpanded={true}
      >
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          className={classes.tableOfContentsHeader}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography className={classes.selectableText} variant="h1">
            INNEHÅLL
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Grid container spacing={0}>
            {this.renderChapters(document)}
          </Grid>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export default withStyles(styles)(TableOfContents);
