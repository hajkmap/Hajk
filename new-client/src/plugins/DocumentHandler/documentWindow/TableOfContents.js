import React from "react";
import withStyles from "@mui/styles/withStyles";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { withTheme } from "@emotion/react";
import {
  Grid,
  List,
  ListItem,
  ListItemText,
  Button,
  Collapse,
} from "@mui/material";

const styles = (theme) => {
  return {
    tableOfContents: {
      //Need to manually change color when switching between dark/light-mode
      backgroundColor:
        theme.palette.mode === "dark"
          ? theme.palette.grey[700]
          : theme.palette.grey[200],
      tapHighlightColor: "transparent",

      cursor: "pointer",
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },

    focusBackground: {
      backgroundColor: theme.palette.action.selected,
    },

    collapseContainer: {
      width: "100%",
    },

    root: {
      width: "100%",
      padding: theme.spacing(0),
    },
  };
};

function NestedListItemRaw(props) {
  return (
    <ListItem
      component="li"
      button
      size="small"
      dense
      onClick={props.onCLick}
      style={{
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: props.theme.spacing(props.level * 3),
      }}
    >
      <ListItemText>{props.children}</ListItemText>
    </ListItem>
  );
}

const NestedListItem = withStyles(styles)(withTheme(NestedListItemRaw));

class TableOfContents extends React.PureComponent {
  state = {
    expanded: this.props.expanded,
  };

  static defaultProps = {
    expanded: true,
    title: "Innehåll",
  };

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

  showSubChapter = (level) => {
    const { chapterLevelsToShow } = this.props;
    return level < chapterLevelsToShow;
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
    if (!this.showSubChapter(level)) {
      return null;
    }
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
    const { classes, activeDocument, title, expanded, toggleCollapse } =
      this.props;

    return (
      <Grid className={classes.tableOfContents} container>
        <Button
          disableRipple
          focusVisibleClassName={classes.focusBackground}
          style={{
            paddingLeft: "0px",
            display: "flex",
            justifyContent: "space-between",
          }}
          color="inherit"
          fullWidth
          endIcon={
            expanded ? (
              <ExpandLessIcon></ExpandLessIcon>
            ) : (
              <ExpandMoreIcon></ExpandMoreIcon>
            )
          }
          onClick={toggleCollapse}
        >
          {title}
        </Button>
        <Collapse
          className={classes.collapseContainer}
          in={expanded}
          id="expansion-panel-content"
          aria-hidden={!expanded}
        >
          <Grid container spacing={0}>
            {this.renderChapters(activeDocument)}
          </Grid>
        </Collapse>
      </Grid>
    );
  }
}

export default withStyles(styles)(TableOfContents);
