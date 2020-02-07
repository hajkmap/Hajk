import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import MenuItemView from "./MenuItemView";
import HeaderView from "./HeaderView";
import MenuView from "./MenuView";
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

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2,
  fullWidth = 12;

class MenuOverlayView extends React.PureComponent {
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
      this.setState({ menuItems: menuItems, subMenu: true });
    });
  }

  close = () => {
    this.setState({ open: false });
  };

  render() {
    const { classes } = this.props;

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
                <HeaderView subMenu={this.state.subMenu}></HeaderView>
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

export default withStyles(styles)(withSnackbar(MenuOverlayView));
