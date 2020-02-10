import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import HeaderView from "./HeaderView";
import MenuView from "./MenuView";
import Modal from "@material-ui/core/Modal";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

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
  { mainDocument: true, color: "#b7e1c8", title: "Utgångspunkter" },
  { mainDocument: true, color: "#e0d0e7", title: "Utvecklingsstrategi" },
  { mainDocument: true, color: "#faceb9", title: "Geografisk inriktning" },
  { mainDocument: true, color: "#bfe4f2", title: "Tematiska inriktningar" },
  { mainDocument: true, color: "#008767", title: "Riksintressen" },
  { mainDocument: true, color: "#d1d9dc", title: "Hållbarhetsbedömning" },
  { mainDocument: true, color: "#ffffff", title: "Fördjupningar" },
  { mainDocument: true, color: "#ffffff", title: "Tematiska tillägg" },
  { mainDocument: true, color: "#ffffff", title: "Markanvändningskarta" },
  { color: "#b7e1c8", mainTitle: "Utgångspunkter", title: "Submenyval1" },
  { color: "#e0d0e7", mainTitle: "Utgångspunkter", title: "Submenyval2" },
  { color: "#faceb9", mainTitle: "Utgångspunkter", title: "Submenyval3" }
];

const fullWidth = 12;
const mapDiv = document.getElementById("map");

class OverlayView extends React.PureComponent {
  state = {
    open: true,
    subMenu: false,
    menuItems: mockedMenuItems.filter(document => {
      return document.mainDocument;
    })
  };

  static propTypes = {};
  static defaultProps = {};

  constructor(props) {
    super(props);
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.localObserver.subscribe("document-clicked", title => {
      var menuItems = mockedMenuItems.filter(document => {
        return document.mainTitle === title;
      });
      this.setState({
        menuItems: menuItems,
        subMenu: true,
        activeTitle: title
      });
    });
    this.localObserver.subscribe("reset", title => {
      this.reset();
    });
  }

  handleMapBlur = () => {
    if (this.state.open) {
      mapDiv.setAttribute("style", "filter : blur(5px)");
    } else {
      mapDiv.removeAttribute("style", "filter : blur(5px)");
    }
  };

  close = () => {
    this.setState({ open: false });
  };

  reset = () => {
    this.setState({
      menuItems: mockedMenuItems.filter(document => {
        return document.mainDocument;
      }),
      subMenu: false
    });
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
                <HeaderView
                  title={this.state.activeTitle}
                  subMenu={this.state.subMenu}
                  localObserver={this.localObserver}
                ></HeaderView>
              </Grid>
              <MenuView
                menuItems={this.state.menuItems}
                model={this.DocumentHandlerModel}
                app={this.props.app}
                localObserver={this.localObserver}
              ></MenuView>
            </Grid>
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(OverlayView));
