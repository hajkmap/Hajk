import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import CascadeMenu from "./CascadeMenu";
import NestedListItem from "./NestedListItem";

const styles = theme => ({});
class MenuBarCascadeMenuItem extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  state = {
    anchorEl: null,
    menuOpen: false,
    childWidth: 200,
    showSubMenu: true
  };

  constructor() {
    super();
    this.ref = React.createRef();
  }

  handleClick = () => {
    this.setState({ showSubMenu: !this.state.showSubMenu });
  };

  getButton = () => {
    const { item, getIcon } = this.props;

    var icon = item.icon ? getIcon(item.icon) : null;
    return (
      <NestedListItem
        level={item.level}
        role="button"
        onClick={this.handleClick}
        title={item.title}
        icon={icon}
        showSubMenu={this.state.showSubMenu}
        hasSubMenu="true"
        borderColor={item.color}
      ></NestedListItem>
    );
  };

  render() {
    const { item, localObserver } = this.props;

    return (
      <>
        {this.getButton()}
        <CascadeMenu
          open={this.state.showSubMenu}
          items={item.menu}
          localObserver={localObserver}
        ></CascadeMenu>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarCascadeMenuItem));
