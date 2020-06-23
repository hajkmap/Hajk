import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import NestedListItem from "./NestedListItem";

const styles = theme => ({});

class PanelMenuListItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  render() {
    const { handleMenuButtonClick, item, getIcon } = this.props;
    var icon = item.icon ? getIcon(item.icon) : null;

    return (
      <NestedListItem
        icon={icon}
        title={item.title}
        level={item.level}
        onClick={handleMenuButtonClick}
      ></NestedListItem>
    );
  }
}

export default withStyles(styles)(withSnackbar(PanelMenuListItem));
