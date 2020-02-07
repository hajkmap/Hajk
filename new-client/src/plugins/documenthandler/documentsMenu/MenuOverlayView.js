import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import MenuItemView from "./MenuItemView";
import LogoItemView from "./LogoItemView";
import Modal from "@material-ui/core/Modal";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

const mapDiv = document.getElementById("map");

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

const mockedMenuItems = [
  { color: "#b7e1c8", title: "Utgångspunkter" },
  { color: "#faceb9", title: "Geografisk inriktning" },
  { color: "#e0d0e7", title: "Utvecklingsstrategi" },
  { color: "#bfe4f2", title: "Tematiska inriktningar" },
  { color: "#008767", title: "Riksintressen" },
  { color: "#d1d9dc", title: "Hållbarhetsbedömning" }
];

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2,
  fullWidth = 12;

class MenuOverlayView extends React.PureComponent {
  state = {
    open: true
  };

  static propTypes = {};
  static defaultProps = {};

  constructor(props) {
    super(props);
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  close = () => {
    this.setState({ open: false });
  };

  renderMenuItem = menuItem => {
    return (
      <Grid
        key={menuItem.title}
        zeroMinWidth
        item
        xs={xs}
        sm={sm}
        md={md}
        lg={lg}
      >
        <MenuItemView
          model={this.DocumentHandlerModel}
          app={this.props.app}
          title={menuItem.title}
          color={menuItem.color}
          localObserver={this.localObserver}
        ></MenuItemView>
      </Grid>
    );
  };

  handleMapBlur = () => {
    if (this.state.open) {
      mapDiv.setAttribute("style", "filter : blur(5px)");
    } else {
      mapDiv.removeAttribute("style", "filter : blur(5px)");
    }
  };

  render() {
    const { classes } = this.props;
    this.handleMapBlur();
    return (
      <>
        <Modal
          className={classes.modal}
          onBackdropClick={this.close}
          open={this.state.open}
        >
          <Container className={classes.container} fixed>
            <Grid className={classes.grid} container>
              <Grid zeroMinWidth item xs={fullWidth}>
                <LogoItemView></LogoItemView>
              </Grid>
              {mockedMenuItems.map(menuItem => {
                return this.renderMenuItem(menuItem);
              })}
            </Grid>
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuOverlayView));
