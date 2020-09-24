import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import ListItem from "@material-ui/core/ListItem";
import Checkbox from "@material-ui/core/Checkbox";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import PropTypes from "prop-types";
import { Typography } from "@material-ui/core";

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
        <Typography variant="srOnly">Minimera submeny</Typography>
        <ExpandLess />
      </ListItemIcon>
    ) : (
      <ListItemIcon
        onClick={this.handleOnExpandIconClick}
        classes={{ root: classes.collapseIconRoot }}
      >
        <Typography variant="srOnly">Maximera submeny</Typography>
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
            paddingLeft: theme.spacing(1) + theme.spacing(chapter.level * 3),
            borderLeft: `${theme.spacing(0.5)}px solid ${chapter.color}`,
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
