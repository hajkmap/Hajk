import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import HeaderView from "../HeaderView";
import OverlayMenuView from "./OverlayMenuView";
import Modal from "@material-ui/core/Modal";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

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

const fullWidth = 12;
const mapDiv = document.getElementById("map");

class OverlayView extends React.PureComponent {
  state = {
    open: true,
    subMenu: false,
    activeDocument: null,
    menuItems: []
  };

  static propTypes = {};
  static defaultProps = {};

  handleMapBlur = () => {
    if (this.state.open) {
      mapDiv.setAttribute("style", "filter : blur(7px)");
    } else {
      mapDiv.removeAttribute("style", "filter : blur(7px)");
    }
  };

  close = () => {
    this.setState({ open: false });
  };

  render() {
    const { classes, localObserver, app, subMenu, menuItems } = this.props;
    this.handleMapBlur();
    return (
      <>
        <Modal
          className={classes.modal}
          onBackdropClick={this.close}
          open={this.state.open}
        >
          <Container className={classes.container} fixed>
            <Grid zeroMinWidth item xs={fullWidth}>
              <HeaderView
                subMenu={subMenu}
                menuItems={menuItems}
                localObserver={localObserver}
              ></HeaderView>
            </Grid>
            <Grid container>
              <OverlayMenuView
                app={app}
                menuItems={menuItems}
                localObserver={localObserver}
              ></OverlayMenuView>
            </Grid>
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(OverlayView));
