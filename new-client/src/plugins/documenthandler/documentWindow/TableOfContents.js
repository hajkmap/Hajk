import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { withTheme } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import Typography from "@material-ui/core/Typography";

const styles = (theme) => {
  return {
    tableOfContents: {
      borderTop: "solid",
      borderBottom: "solid",
      backgroundColor: theme.palette.grey[200],
    },
    root: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: theme.palette.grey[200],
    },
  };
};

function NestedListItemRaw(props) {
  return (
    <ListItem
      button
      component="li"
      size="small"
      onClick={props.onCLick}
      style={{ paddingLeft: props.theme.spacing(props.level * 3) }}
    >
      <ListItemText>{props.children}</ListItemText>
    </ListItem>
  );
}

const NestedListItem = withTheme(NestedListItemRaw);

class TableOfContents extends React.PureComponent {
  linkClick = (chapter) => {
    const { localObserver } = this.props;
    localObserver.publish("scroll-to-chapter", chapter);
  };
  /**
   * Render all chapters of the activeDocument.
   * @param {Array} activeDocument An array with all chapters of the activeDocument.
   *
   * @memberof TableOfContents
   */
  renderChapters = (activeDocument) => {
    const { classes } = this.props;
    let mainChapter = 0;
    return (
      <List className={classes.root} aria-labelledby="nested-list-subheader">
        {Array.isArray(activeDocument?.chapters)
          ? activeDocument.chapters.map((chapter) =>
              this.renderSubChapters(chapter, 0, (++mainChapter).toString())
            )
          : null}
      </List>
    );
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
      <React.Fragment key={chapter.header}>
        <NestedListItem
          chapter={chapter}
          onCLick={() => {
            this.linkClick(chapter);
          }}
          level={level}
        >
          {chapter.header}
        </NestedListItem>
        <List disablePadding>
          {Array.isArray(chapter.chapters)
            ? chapter.chapters.map((subChapter) =>
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
      <Accordion
        square
        elevation={0}
        className={classes.tableOfContents}
        style={{ borderColor: documentColor }}
        defaultExpanded={true}
      >
        <AccordionSummary
          aria-controls="expansion-panel-content"
          expandIcon={<ExpandMoreIcon />}
        >
          <Typography variant="h2">Innehåll</Typography>
        </AccordionSummary>
        <AccordionDetails id="expansion-panel-content">
          <Grid container spacing={0}>
            {this.renderChapters(activeDocument)}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  }
}

export default withStyles(styles)(TableOfContents);
