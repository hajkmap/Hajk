import React from "react";
import { withStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { withTheme } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import Typography from "@material-ui/core/Typography";

const styles = theme => {
  return {
    tableOfContents: {
      borderTop: "solid",
      borderBottom: "solid",
      backgroundColor: theme.palette.grey[200]
    },
    selectableText: {
      userSelect: "text"
    },
    root: {
      width: "100%",

      maxWidth: 360,
      backgroundColor: theme.palette.grey[200]
    },
    nested: {
      paddingLeft: theme.spacing(4)
    }
  };
};

function NestedListItemRaw(props) {
  return (
    <ListItem
      button
      size="small"
      onClick={props.onCLick}
      style={{ paddingLeft: props.theme.spacing(props.level) }}
    >
      <ListItemText>{props.children}</ListItemText>
    </ListItem>
  );
}

const NestedListItem = withTheme(NestedListItemRaw);

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
    this.activeDocument = this.props.activeDocument;
  }

  /**
   * Render all chapters of the activeDocument.
   * @param {Array} activeDocument An array with all chapters of the activeDocument.
   *
   * @memberof TableOfContents
   */
  renderChapters = activeDocument => {
    const { classes } = this.props;
    let mainChapter = 0;
    return (
      <List
        component="nav"
        className={classes.root}
        aria-labelledby="nested-list-subheader"
      >
        {Array.isArray(activeDocument?.chapters)
          ? activeDocument.chapters.map(chapter =>
              this.renderSubChapters(chapter, 0, (++mainChapter).toString())
            )
          : null}
      </List>
    );
  };

  linkClick = chapter => {
    const { localObserver } = this.props;
    localObserver.publish("scroll-to-chapter", chapter);
  };

  /*
    <Link
          href="#"
          variant="h4"
          underline="hover"
          onClick={() => {
            this.linkClick(chapter);
          }}
        >*/

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
      <React.Fragment key={chapter.header}>
        <NestedListItem
          chapter={chapter}
          onCLick={() => {
            this.linkClick(chapter);
          }}
          level={level}
          button
        >
          {subChapterNumber + " " + chapter.header}
        </NestedListItem>
        <List component="div" disablePadding>
          {Array.isArray(chapter.chapters)
            ? chapter.chapters.map(subChapter =>
                this.renderSubChapters(
                  subChapter,
                  newLevel,
                  subChapterNumber.concat("." + ++number)
                )
              )
            : null}
        </List>
      </React.Fragment>
    );
  };

  render() {
    const { classes, activeDocument, documentColor } = this.props;
    return (
      <ExpansionPanel
        square
        elevation={0}
        className={classes.tableOfContents}
        style={{ borderColor: documentColor }}
        defaultExpanded={true}
      >
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h2">Innehåll</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Grid container spacing={0}>
            {this.renderChapters(activeDocument)}
          </Grid>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export default withStyles(styles)(TableOfContents);
