import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import PanelList from "./PanelList";

const styles = theme => ({});

class PanelMenuView extends React.PureComponent {
  constructor(props) {
    super(props);

    props.options.menuConfig.menu.forEach(menuItem => {
      this.setMenuItemLevel(menuItem, 0);
    });

    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    const { localObserver } = this.props;

    localObserver.subscribe("document-clicked", item => {
      localObserver.publish("show-document", item.document);
    });

    localObserver.subscribe("link-clicked", item => {
      window.open(item.link, "_blank");
    });

    localObserver.subscribe("maplink-clicked", item => {
      localObserver.publish("fly-to", item.maplink);
    });
  };

  setMenuItemLevel(menuItem, level) {
    menuItem.level = level;
    level = level + 1;
    if (menuItem.menu && menuItem.menu.length > 0) {
      menuItem.menu.forEach(subMenuItem => {
        this.setMenuItemLevel(subMenuItem, level);
      });
    }
  }

  render() {
    const { localObserver } = this.props;
    return (
      <PanelList
        localObserver={localObserver}
        globalObserver={this.props.app.globalObserver}
        menu={this.props.options.menuConfig.menu}
      ></PanelList>
    );
  }
}

export default withStyles(styles)(withSnackbar(PanelMenuView));
