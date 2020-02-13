import React from "react";
import ReactDOM from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";

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
  },
  menu: {
    width: "500px"
  }
});

class MenuBarView extends React.PureComponent {
  state = {};

  static propTypes = {};
  static defaultProps = {};

  constructor(props) {
    super(props);
  }

  render() {
    const { classes, app, localObserver } = this.props;
    console.log(document.getElementsByTagName("header"), "header?");
    return ReactDOM.createPortal(
      <AppBar className={classes.menu} position="relative">
        <Toolbar>{/* content */}</Toolbar>
      </AppBar>,
      document.getElementById("header")
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarView));
