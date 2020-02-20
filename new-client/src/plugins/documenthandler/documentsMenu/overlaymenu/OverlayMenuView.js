import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

import menuItem from "../MenuItemHOC";

import Grid from "@material-ui/core/Grid";
import _OverlayLinkMenuItem from "./OverlayLinkMenuItem";
import _OverlayDocumentMenuItem from "./OverlayDocumentMenuItem";
import _OverlayCascadeMenuItem from "./OverlayCascadeMenuItem";
import _OverlayMapLinkMenuItem from "./OverlayMapLinkMenuItem";

const OverlayCascadeMenuItem = menuItem(_OverlayCascadeMenuItem);
const OverlayDocumentMenuItem = menuItem(_OverlayDocumentMenuItem);
const OverlayLinkMenuItem = menuItem(_OverlayLinkMenuItem);
const OverlayMapLinkMenuItem = menuItem(_OverlayMapLinkMenuItem);

const styles = theme => ({
  container: {
    backgroundColor: "rgba(38, 44, 44, 0.4)",
    outline: "none",
    minHeight: "80%",
    marginTop: "5%",
    marginBottom: "5%",
    [theme.breakpoints.down("xs")]: {
      height: "100%",
      overflow: "scroll",
      marginTop: 0,
      marginBottom: 0
    }
  },
  menuItem: {
    height: theme.spacing(20),
    maxWidth: theme.spacing(30),
    minWidth: theme.spacing(22),
    margin: theme.spacing(1),
    backgroundColor: "rgba(38, 44, 44, 0)",
    cursor: "pointer",
    [theme.breakpoints.down("xs")]: {
      height: "100%"
    }
  }
});

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2,
  fullWidth = 12;

class MenuView extends React.PureComponent {
  state = {
    activeDocumentMenu: null
  };

  static propTypes = {};
  static defaultProps = {};

  getMenuItem = item => {
    const { localObserver } = this.props;
    if (item.menu && item.menu.length > 0) {
      return (
        <OverlayCascadeMenuItem
          localObserver={localObserver}
          title={item.title}
        ></OverlayCascadeMenuItem>
      );
    } else if (item.document) {
      return (
        <OverlayDocumentMenuItem
          localObserver={localObserver}
          title={item.title}
        ></OverlayDocumentMenuItem>
      );
    } else if (item.link) {
      return (
        <OverlayLinkMenuItem
          localObserver={localObserver}
          title={item.title}
        ></OverlayLinkMenuItem>
      );
    } else if (item.maplink) {
      return (
        <OverlayMapLinkMenuItem
          localObserver={localObserver}
          title={item.title}
        ></OverlayMapLinkMenuItem>
      );
    }
  };

  renderMenuItem = item => {
    console.log("HEj");
    return (
      <Grid key={item.title} zeroMinWidth item xs={xs} sm={sm} md={md} lg={lg}>
        {this.getMenuItem(item)}
      </Grid>
    );
  };

  render() {
    const { activeMenuSection } = this.props;
    return (
      <>
        {activeMenuSection.map(item => {
          return this.renderMenuItem(item);
        })}
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuView));
