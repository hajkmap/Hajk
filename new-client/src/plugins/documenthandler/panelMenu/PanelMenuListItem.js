import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import Icon from "@material-ui/core/Icon";
import ListItem from "@material-ui/core/ListItem";
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

class PanelMenuListItem extends React.PureComponent {
  static propTypes = {
    onClick: PropTypes.func.isRequired,
    item: PropTypes.object.isRequired,
  };

  static defaultProps = { hasSubMenu: false };

  getListTitle = () => {
    const { item } = this.props;
    return <ListItemText>{item.title}</ListItemText>;
  };

  getCollapseIcon = () => {
    const { expandedSubMenu, classes, item } = this.props;
    return expandedSubMenu ? (
      <ListItemIcon classes={{ root: classes.collapseIconRoot }}>
        {!item.title && (
          <Typography variant="srOnly">Minimera submeny</Typography>
        )}
        <ExpandLess />
      </ListItemIcon>
    ) : (
      <ListItemIcon classes={{ root: classes.collapseIconRoot }}>
        {!item.title && (
          <Typography variant="srOnly">Maximera submeny</Typography>
        )}
        <ExpandMore />
      </ListItemIcon>
    );
  };

  getListIcon = (item) => {
    const { classes } = this.props;
    return (
      <ListItemIcon className={classes.listItemIcon}>
        {!item.title && (
          <Typography variant="srOnly">{item.icon.descriptiveText}</Typography>
        )}
        <Icon style={{ fontSize: item.icon.fontSize }}>
          {item.icon.materialUiIconName}
        </Icon>
      </ListItemIcon>
    );
  };

  render() {
    const { onClick, item, hasSubMenu, classes, theme } = this.props;

    return (
      <>
        <ListItem
          divider
          button
          size="small"
          disableGutters
          aria-controls={hasSubMenu ? `${item.id}` : null}
          onClick={onClick}
          className={classes.listItem}
          style={{
            paddingLeft: theme.spacing(1) + theme.spacing(item.level * 3),
            borderLeft: `${theme.spacing(1)}px solid ${item.color}`,
          }}
        >
          {item.icon ? this.getListIcon(item) : null}
          {item.title && this.getListTitle()}
          {hasSubMenu && this.getCollapseIcon()}
        </ListItem>
      </>
    );
  }
}

export default withStyles(styles)(withTheme(PanelMenuListItem));
