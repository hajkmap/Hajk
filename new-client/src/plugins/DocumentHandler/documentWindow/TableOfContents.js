import React from "react";
import { withStyles } from "@material-ui/core/styles";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { withTheme } from "@material-ui/core/styles";
import {
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Collapse,
} from "@material-ui/core";

const styles = (theme) => {
  return {
    tableOfContents: {
      backgroundColor: theme.palette.grey[200],
      cursor: "pointer",
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
    collapseContainer: {
      width: "100%",
    },
    listItemText: {
      "&:hover": {
        backgroundColor: theme.palette.grey[300],
      },
    },
    root: {
      width: "100%",
      padding: theme.spacing(0),
      backgroundColor: theme.palette.grey[200],
    },
  };
};

function NestedListItemRaw(props) {
  const { classes } = props;
  return (
    <ListItem
      component="li"
      size="small"
      dense
      onClick={props.onCLick}
      style={{
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: props.theme.spacing(props.level * 3),
      }}
    >
      <ListItemText
        className={classes.listItemText}
        role="link"
        onClick={props.onCLick}
      >
        {props.children}
      </ListItemText>
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
    const {
      classes,
      activeDocument,
      title,
      expanded,
      toggleCollapse,
    } = this.props;

    return (
      <Grid className={classes.tableOfContents} container>
        <Grid
          onClick={toggleCollapse}
          xs={12}
          alignItems="center"
          justify="space-between"
          container
          item
        >
          <Grid item>
            <Typography variant="h2">{title}</Typography>
          </Grid>
          <Grid item>
            {expanded ? (
              <ExpandLessIcon></ExpandLessIcon>
            ) : (
              <ExpandMoreIcon></ExpandMoreIcon>
            )}
          </Grid>
        </Grid>
        <Collapse
          className={classes.collapseContainer}
          in={expanded}
          id="expansion-panel-content"
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
