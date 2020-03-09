import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import HeaderView from "../HeaderView";
import Modal from "@material-ui/core/Modal";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import menuItem from "../MenuItemHOC";
import OverlayMenuItemStripped from "./OverlayMenuItem";

import { Paper, Typography } from "@material-ui/core";
import ReactDOM from "react-dom";

const OverlayMenuItem = menuItem(OverlayMenuItemStripped);
const header = document.getElementById("header");

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
  },
  gridContainer: {
    paddingTop: theme.spacing(3)
  },
  root: {
    padding: "2px 4px",
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    marginRight: theme.spacing(6),
    minHeight: theme.spacing(6)
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

    open ? this.props.addMapBlur() : this.props.removeMapBlur();

    return (
      <>
        {open === false &&
          ReactDOM.createPortal(
            <Paper
              onClick={this.open}
              style={{ backgroundColor: options.openOverlayButtonColor }}
              className={classes.root}
            >
              <Typography
                style={{ wordWrap: "break-word" }}
                variant="subtitle1"
                align="center"
                color="textPrimary"
              >
                ÖPPNA MENY
              </Typography>
            </Paper>,
            header
          )}
        <Modal
          className={classes.modal}
          onBackdropClick={this.close}
          open={open}
        >
          <Container className={classes.container} fixed>
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
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(OverlayView));
