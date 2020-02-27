import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import HeaderView from "../HeaderView";
import Modal from "@material-ui/core/Modal";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import menuItem from "../MenuItemHOC";
import OverlayMenuItemStripped from "./OverlayMenuItem";

const OverlayMenuItem = menuItem(OverlayMenuItemStripped);

const styles = theme => ({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
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
  }
});

const fullWidth = 12;

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2;

class OverlayView extends React.PureComponent {
  state = {
    open: true
  };

  static propTypes = {};
  static defaultProps = {};

  close = () => {
    this.setState({ open: false });
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
    const { classes, localObserver, activeMenuSection } = this.props;
    const { open } = this.state;

    open ? this.props.addMapBlur() : this.props.removeMapBlur();

    return (
      <>
        <Modal
          className={classes.modal}
          onBackdropClick={this.close}
          open={open}
        >
          <Container className={classes.container} fixed>
            <Grid zeroMinWidth item xs={fullWidth}>
              <HeaderView
                activeMenuSection={activeMenuSection}
                localObserver={localObserver}
              ></HeaderView>
            </Grid>
            <Grid container>
              {activeMenuSection.map((item, index) => {
                return this.renderMenuItem(item, index);
              })}
            </Grid>
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(OverlayView));
