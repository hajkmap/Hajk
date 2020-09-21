import React from "react";
import PanelMenuListItem from "./PanelMenuListItem";
import PanelList from "./PanelList";
import Collapse from "@material-ui/core/Collapse";

class PanelMenuView extends React.PureComponent {
  state = {
    open: this.props.item.expandedSubMenu || false,
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
        <Collapse
          aria-expanded={this.state.open}
          id={item.id}
          in={this.state.open}
          timeout="auto"
        >
          <PanelList {...this.props} menu={item.menu}></PanelList>
        </Collapse>
      </>
    );
  }
}

export default PanelMenuView;
