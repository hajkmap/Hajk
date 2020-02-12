import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import MenuItem from "./MenuItem";

import Divider from "@material-ui/core/Divider";
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

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2,
  fullWidth = 12;

class MenuView extends React.PureComponent {
  state = {
    activeDocumentMenu: null
  };

  static propTypes = {};
  static defaultProps = {};

  constructor(props) {
    super(props);
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  renderMenuItem = menuItem => {
    console.log(menuItem, "menuItem");
    const { localObserver, app } = this.props;
    return (
      <Grid
        key={menuItem.header}
        zeroMinWidth
        item
        xs={xs}
        sm={sm}
        md={md}
        lg={lg}
      >
        <MenuItem
          key={menuItem.header}
          model={this.DocumentHandlerModel}
          app={app}
          header={menuItem.header}
          color={menuItem.color}
          localObserver={localObserver}
        ></MenuItem>
      </Grid>
    );
  };

  render() {
    const { chapters, menuItems } = this.props;

    return (
      <>
        {menuItems.map(item => {
          return this.renderMenuItem(item);
        })}
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuView));
