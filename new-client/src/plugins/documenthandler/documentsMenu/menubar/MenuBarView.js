import React from "react";
import ReactDOM from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import { Paper, Button } from "@material-ui/core";

import menuItem from "../MenuItemHOC";
import MenuItem from "./MenuBarItem";

const MenuBarItem = menuItem(MenuItem);

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

  root: {
    padding: "2px 4px",
    display: "flex",
    alignItems: "center",
    marginRight: theme.spacing(6),
    minWidth: theme.spacing(180), //DEBUG
    minHeight: theme.spacing(8)
  }
});

class MenuBarView extends React.PureComponent {
  state = {};

  static propTypes = {};
  static defaultProps = {};

  constructor(props) {
    super(props);
  }

  renderButtons(menuItem) {
    const { classes, app, localObserver } = this.props;

    return (
      <MenuBarItem
        localObserver={localObserver}
        key={menuItem.header}
        model={this.DocumentHandlerModel}
        app={app}
        header={menuItem.header}
        color={menuItem.color}
      ></MenuBarItem>
    );
  }

  render() {
    const { classes, app, localObserver, menuItems } = this.props;

    return ReactDOM.createPortal(
      <Paper className={classes.root}>
        {menuItems.map(item => {
          return this.renderButtons(item);
        })}
      </Paper>,
      document.getElementById("header")
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarView));
