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
import PropTypes from "prop-types";

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
    return expandedSubMenu ? <ExpandLess /> : <ExpandMore />;
  };

  getListIcon = icon => {
    return (
      <ListItemIcon>
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
          onClick={onClick}
          className={classes.listItem}
          style={{
            paddingLeft: theme.spacing(1) + theme.spacing(item.level * 2),
            borderLeft: `${theme.spacing(1)}px solid ${item.color}`
          }}
        >
          {item.icon ? this.getListIcon(item.icon) : null}
          {item.title && this.getListTitle()}
          {hasSubMenu && this.getCollapseIcon()}
        </ListItem>
      </>
    );
  }
}

export default withStyles(styles)(withTheme(withSnackbar(PanelMenuListItem)));
