import React from "react";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { withStyles } from "@material-ui/core/styles";

import MapSwitcher from "./MapSwitcher";
import BackgroundCleaner from "./BackgroundCleaner";

const styles = theme => {
  return {
    toolbarMenu: {
      display: "flex",
      alignItems: "center"
    },
    toolbarMenuButton: {
      display: "none",
      [theme.breakpoints.down("xs")]: {
        display: "block"
      }
    },
    icon: {
      color: theme.palette.primary.dark,
      padding: "3px"
    },
    toolbarMenuItems: {
      display: "flex",
      [theme.breakpoints.down("xs")]: {
        position: "absolute",
        top: "48px",
        background: "white",
        padding: "10px",
        minWidth: "80px",
        border: "1px solid #ccc",
        boxShadow: "2px 2px 2px rgba(0, 0, 0, 0.18)",
        borderRadius: "4px",
        right: 0
      }
    }
  };
};
class ToolbarMenu extends React.Component {
  constructor() {
    super();
    this.state = {
      menuVisible: window.innerWidth > 600
    };
    window.addEventListener("resize", () => {
      this.setState({
        menuVisible: window.innerWidth > 600
      });
    });
  }

  renderSearchPlugin() {
    const { classes, appModel } = this.props;
    const searchPlugin = appModel.plugins.search;
    if (searchPlugin) {
      return (
        <div className={classes.searchWidget}>
          <searchPlugin.component
            map={searchPlugin.map}
            app={searchPlugin.app}
            options={searchPlugin.options}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  hideMenu = e => {
    this.setState(
      {
        menuVisible: false
      },
      () => {
        document.body.removeEventListener("click", this.hideMenu);
      }
    );
  };

  render() {
    const { classes, appModel } = this.props;
    return (
      <div className={classes.toolbarMenu}>
        {this.renderSearchPlugin()}
        <div
          className={classes.toolbarMenuButton}
          onClick={() => {
            this.setState(
              {
                menuVisible: !this.state.menuVisible
              },
              () => {
                if (this.state.menuVisible) {
                  document.body.addEventListener("click", this.hideMenu);
                }
              }
            );
          }}
        >
          <MoreVertIcon className={classes.icon} />
        </div>
        <div
          className={classes.toolbarMenuItems}
          style={{
            display: this.state.menuVisible
              ? window.innerWidth < 600
                ? "block"
                : "flex"
              : "none"
          }}
        >
          <div>
            <MapSwitcher appModel={appModel} />{" "}
            <BackgroundCleaner appModel={appModel} />{" "}
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ToolbarMenu);
