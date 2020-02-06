import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import MenuItemView from "./MenuItemView";
import Modal from "@material-ui/core/Modal";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

const styles = theme => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1
  },
  container: {
    marginTop: "10%",
    marginBottom: "10%"
  },
  grid: {
    backgroundColor: "rgba(38, 44, 44, 0.4)"
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
  md = 4,
  lg = 3;

class MenuOverlayView extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    counter: 0
  };

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  renderMenuItem = menuItem => {
    return (
      <Grid item xs={xs} sm={sm} md={md} lg={lg}>
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

  render() {
    const { classes } = this.props;

    return (
      <>
        <Modal open="true">
          <Container className={classes.container}>
            <Grid
              className={classes.grid}
              zeroMinWidth="true"
              container
              alignItems="center"
              justify="left"
              spacing={1}
            >
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
