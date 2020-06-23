import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import CascadeMenu from "./CascadeMenu";
import NestedListItem from "./NestedListItem";

const styles = theme => ({});
class MenuBarCascadeMenuItem extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  state = {
    anchorEl: null,
    menuOpen: false,
    childWidth: 200
  };

  constructor() {
    super();
    this.ref = React.createRef();
  }

  getButton = () => {
    const { item, getIcon } = this.props;

    var icon = item.icon ? getIcon(item.icon) : null;
    console.log(item.level, "level");
    return (
      <NestedListItem
        level={item.level}
        role="button"
        onClick={this.handleClick}
        title={item.title}
        icon={icon}
      ></NestedListItem>
    );
  };

  render() {
    const { item, localObserver } = this.props;

    return (
      <>
        {this.getButton()}
        <CascadeMenu
          items={item.menu}
          localObserver={localObserver}
        ></CascadeMenu>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarCascadeMenuItem));
