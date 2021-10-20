import React from "react";
import withStyles from "@mui/styles/withStyles";
import { withTheme } from "@emotion/react";
import ListItem from "@mui/material/ListItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PropTypes from "prop-types";
import { visuallyHidden } from "@mui/utils";

const styles = (theme) => ({
  listItem: { overflowWrap: "break-word" },
  listItemIcon: { minWidth: theme.spacing(3) },
  collapseIconRoot: { minWidth: theme.spacing(4) },
});

class PrintListItem extends React.PureComponent {
  static propTypes = {
    chapter: PropTypes.object.isRequired,
  };

  state = {
    expandedSubMenu: false,
  };

  getListTitle = () => {
    const { chapter } = this.props;
    return <ListItemText>{chapter.header}</ListItemText>;
  };

  handleOnExpandIconClick = (e) => {
    const { toggleSubmenu } = this.props;
    e.stopPropagation();
    if (toggleSubmenu) {
      toggleSubmenu();
    }
    this.setState((prevState) => {
      return { expandedSubMenu: !prevState.expandedSubMenu };
    });
  };

  getCollapseIcon = () => {
    const { classes } = this.props;
    const { expandedSubMenu } = this.state;

    return expandedSubMenu ? (
      <ListItemIcon
        onClick={this.handleOnExpandIconClick}
        classes={{ root: classes.collapseIconRoot }}
      >
        <span style={visuallyHidden}>Minimera submeny</span>
        <ExpandLess />
      </ListItemIcon>
    ) : (
      <ListItemIcon
        onClick={this.handleOnExpandIconClick}
        classes={{ root: classes.collapseIconRoot }}
      >
        <span style={visuallyHidden}>Maximera submeny</span>
        <ExpandMore />
      </ListItemIcon>
    );
  };

  render() {
    const {
      chapter,
      classes,
      theme,
      hasSubChapters,
      checked,
      handleCheckboxChange,
    } = this.props;
    return (
      <>
        <ListItem
          divider
          button
          size="small"
          disableGutters
          onClick={(e) => handleCheckboxChange(chapter)}
          aria-controls="submenu"
          className={classes.listItem}
          style={{
            paddingLeft: theme.spacing(1 + chapter.level * 3),
            borderLeft: `${theme.spacing(0.5)} solid ${chapter.color}`,
          }}
        >
          <ListItemIcon className={classes.listItemIcon}>
            <Checkbox
              color="primary"
              onChange={(e) => {
                handleCheckboxChange(chapter);
              }}
              onClick={(e) => e.stopPropagation()}
              edge="start"
              checked={checked}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          {chapter.header && this.getListTitle()}
          {hasSubChapters && this.getCollapseIcon()}
        </ListItem>
      </>
    );
  }
}

export default withStyles(styles)(withTheme(PrintListItem));
