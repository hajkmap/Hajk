import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Icon from "@material-ui/core/Icon";
import { withTheme } from "@material-ui/core/styles";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import IconButton from "@material-ui/core/IconButton";

import PropTypes from "prop-types";
import { Typography } from "@material-ui/core";

const styles = theme => ({
  listItem: { overflowWrap: "break-word" }
});

class PanelMenuListItem extends React.PureComponent {
  static propTypes = {
    onClick: PropTypes.func.isRequired,
    item: PropTypes.object.isRequired
  };

  static defaultProps = { hasSubMenu: false };

  getListTitle = () => {
    const { item } = this.props;
    return <ListItemText>{item.title}</ListItemText>;
  };

  getCollapseIcon = () => {
    const { expandedSubMenu } = this.props;
    return expandedSubMenu ? (
      <ListItemIcon>
        <Typography variant="srOnly">Minimera submeny</Typography>
        <ExpandLess />
      </ListItemIcon>
    ) : (
      <ListItemIcon>
        <Typography variant="srOnly">Maximera submeny</Typography>
        <ExpandMore />
      </ListItemIcon>
    );
  };

  getListIcon = item => {
    var icon = item.icon;
    return (
      <ListItemIcon>
        {//We render text for screen reader if no title is present
        !item.title && (
          <Typography variant="srOnly">{icon.descriptiveText}</Typography>
        )}
        <Icon style={{ fontSize: icon.fontSize }}>
          {icon.materialUiIconName}
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
          aria-controls="submenu"
          onClick={onClick}
          className={classes.listItem}
          style={{
            paddingLeft: theme.spacing(1) + theme.spacing(item.level * 2),
            borderLeft: `${theme.spacing(1)}px solid ${item.color}`
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

export default withStyles(styles)(withTheme(withSnackbar(PanelMenuListItem)));
