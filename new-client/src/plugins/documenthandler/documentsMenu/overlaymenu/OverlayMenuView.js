import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import HeaderView from "../HeaderView";
import CustomModal from "../../documentWindow/CustomModal";
import Grid from "@material-ui/core/Grid";
import menuItem from "../MenuItemHOC";
import OverlayMenuItemStripped from "./OverlayMenuItem";
import { Paper, Typography } from "@material-ui/core";
import ReactDOM from "react-dom";

const OverlayMenuItem = menuItem(OverlayMenuItemStripped);
const header = document.getElementById("header");

const styles = theme => ({
  gridContainer: {
    paddingTop: theme.spacing(3)
  },

  menuButtonText: {
    wordWrap: "break-word",
    padding: theme.spacing(1)
  },
  menuButtonRoot: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    marginLeft: theme.spacing(2),
    minHeight: theme.spacing(5) + 1 //Ugly fix to get same height as search
  }
});

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2;

class OverlayView extends React.PureComponent {
  state = {
    open: false
  };

  static propTypes = {};
  static defaultProps = {};

  close = () => {
    this.setState({ open: false });
  };

  open = () => {
    this.setState({ open: true });
  };

  getMenuItemType = (item, type) => {
    const { localObserver } = this.props;
    return (
      <OverlayMenuItem
        type={type}
        item={item}
        localObserver={localObserver}
      ></OverlayMenuItem>
    );
  };

  getMenuItem = (item, reactKey) => {
    if (item.menu && item.menu.length > 0) {
      return this.getMenuItemType(item, "cascade");
    } else if (item.document) {
      return this.getMenuItemType(item, "document");
    } else if (item.link) {
      return this.getMenuItemType(item, "link");
    } else if (item.maplink) {
      return this.getMenuItemType(item, "maplink");
    }
  };

  renderMenuItem = (item, reactKey) => {
    return (
      <Grid key={reactKey} zeroMinWidth item xs={xs} sm={sm} md={md} lg={lg}>
        {this.getMenuItem(item)}
      </Grid>
    );
  };

  render() {
    const { classes, options, localObserver, activeMenuSection } = this.props;
    const { open } = this.state;

    return (
      <>
        {open === false &&
          ReactDOM.createPortal(
            <Paper
              onClick={this.open}
              style={{ backgroundColor: options.openOverlayButtonColor }}
              className={classes.menuButtonRoot}
            >
              <Typography
                className={classes.menuButtonText}
                variant="subtitle1"
                align="center"
                color="textPrimary"
              >
                Meny
              </Typography>
            </Paper>,
            header
          )}
        <CustomModal
          fullScreen={false}
          className={classes.modal}
          close={this.close}
          open={open}
        >
          <>
            <Grid className={classes.gridContainer}>
              <HeaderView
                options={options}
                activeMenuSection={activeMenuSection}
                localObserver={localObserver}
              ></HeaderView>
            </Grid>
            <Grid container>
              {activeMenuSection.map((item, index) => {
                return this.renderMenuItem(item, index);
              })}
            </Grid>
          </>
        </CustomModal>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(OverlayView));
