import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import List from "@material-ui/core/List";
import PanelSubList from "./PanelSubList";
import PanelMenuListItem from "./PanelMenuListItem";
import PropTypes from "prop-types";

const styles = theme => ({});

class PanelList extends React.PureComponent {
  state = {};

  static propTypes = {
    localObserver: PropTypes.object.isRequired,
    globalObserver: PropTypes.object.isRequired,
    menu: PropTypes.array.isRequired
  };

  handleMenuButtonClick = (type, item) => {
    const { localObserver, globalObserver } = this.props;
    localObserver.publish(`${type}-clicked`, item);
    globalObserver.publish("core.hideDrawer");
  };

  getMenuItemType = (item, type) => {
    const { localObserver } = this.props;
    return (
      <PanelMenuListItem
        type={type}
        onClick={() => {
          //unecessary rerender but to much to keep it in separate component
          this.handleMenuButtonClick(type, item);
        }}
        localObserver={localObserver}
        item={item}
      ></PanelMenuListItem>
    );
  };

  renderActionMenuItem = (item, reactKey) => {
    if (item.document) {
      return this.getMenuItemType(item, "document");
    } else if (item.link) {
      return this.getMenuItemType(item, "link");
    } else if (item.maplink) {
      return this.getMenuItemType(item, "maplink");
    }
  };

  renderSubMenu = item => {
    return <PanelSubList {...this.props} item={item}></PanelSubList>;
  };

  hasSubMenu = item => {
    if (item.menu && item.menu.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  render() {
    const { menu } = this.props;

    return (
      <List disablePadding component="nav">
        {menu.map((item, index) => {
          return (
            <React.Fragment key={index}>
              {this.hasSubMenu(item)
                ? this.renderSubMenu(item)
                : this.renderActionMenuItem(item)}
            </React.Fragment>
          );
        })}
      </List>
    );
  }
}

export default withStyles(styles)(withSnackbar(PanelList));
