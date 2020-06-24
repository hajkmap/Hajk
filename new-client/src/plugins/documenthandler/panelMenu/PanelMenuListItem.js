import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import NestedListItem from "./NestedListItem";
import Icon from "@material-ui/core/Icon";

const styles = theme => ({});

class PanelMenuListItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  getIcon = icon => {
    return (
      <Icon style={{ fontSize: icon.fontSize }}>{icon.materialUiIconName}</Icon>
    );
  };

  render() {
    const { onClick, item, hasSubMenu, expandedSubMenu } = this.props;
    var icon = item.icon ? this.getIcon(item.icon) : null;

    return (
      <NestedListItem
        icon={icon}
        title={item.title}
        level={item.level}
        onClick={onClick}
        expandedSubMenu={expandedSubMenu}
        hasSubMenu={hasSubMenu}
        borderColor={item.color}
      ></NestedListItem>
    );
  }
}

export default withStyles(styles)(withSnackbar(PanelMenuListItem));
