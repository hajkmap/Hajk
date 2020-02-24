import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import menuItem from "../MenuItemHOC";
import Grid from "@material-ui/core/Grid";

import _OverlayMenuItem from "./OverlayMenuItem";
const OverlayMenuItem = menuItem(_OverlayMenuItem);

const styles = theme => ({});

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2;

class MenuView extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  getMenuItem = item => {
    const { localObserver } = this.props;
    if (item.menu && item.menu.length > 0) {
      return (
        <OverlayMenuItem
          type="cascade"
          item={item}
          localObserver={localObserver}
          color="#456576"
        ></OverlayMenuItem>
      );
    } else if (item.document) {
      return (
        <OverlayMenuItem
          type="document"
          item={item}
          localObserver={localObserver}
          color="#458876"
        ></OverlayMenuItem>
      );
    } else if (item.link) {
      return (
        <OverlayMenuItem
          type="link"
          item={item}
          localObserver={localObserver}
          color="#458876"
        ></OverlayMenuItem>
      );
    } else if (item.maplink) {
      return (
        <OverlayMenuItem
          type="maplink"
          item={item}
          localObserver={localObserver}
        ></OverlayMenuItem>
      );
    }
  };

  renderMenuItem = item => {
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
