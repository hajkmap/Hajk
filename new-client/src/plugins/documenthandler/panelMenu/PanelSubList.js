import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import PanelMenuListItem from "./PanelMenuListItem";
import PanelList from "./PanelList";
import Collapse from "@material-ui/core/Collapse";

const styles = theme => ({});

class PanelMenuView extends React.PureComponent {
  state = {
    open: false
  };

  toggleCollapseSubMenu = () => {
    this.setState({ open: !this.state.open });
  };

  render() {
    const { item } = this.props;
    return (
      <>
        <PanelMenuListItem
          hasSubMenu
          expandedSubMenu={this.state.open}
          onClick={this.toggleCollapseSubMenu}
          {...this.props}
        ></PanelMenuListItem>
        <Collapse in={this.state.open} timeout="auto" unmountOnExit>
          <PanelList {...this.props} menu={item.menu}></PanelList>
        </Collapse>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(PanelMenuView));
