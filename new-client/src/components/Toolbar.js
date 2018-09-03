import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Divider
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import "./Toolbar.css"; // TODO: Move styles to JSS and remove the CSS file

const drawerWidth = 240;

const styles = theme => ({
  drawerPaper: {
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  drawerPaperClose: {
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: theme.spacing.unit * 7,
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing.unit * 9
    }
  }
});

class Toolbar extends Component {
  state = { open: false };

  renderTools() {
    return this.props.tools.map((tool, i) => {
      return <tool.component key={i} tool={tool} toolbar={this} />;
    });
  }

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  hide() {
    // FIXME: This was previously used by all plugins to hide
    // toolbar in mobile mode – necessary on small screens
    // this.setState({
    //   toolbarVisible: false
    // });
  }

  // toggleToolbar() {
  //   this.setState({
  //     toolbarVisible: !this.state.toolbarVisible
  //   });
  // }

  render() {
    // If there are no plugins to be rendered to toolbar, just quit
    if (this.props.tools.length < 1) {
      return "";
    }

    const { classes } = this.props;
    let icon;

    if (this.state.open === true) {
      icon = <ChevronLeftIcon />;
    } else {
      icon = <ChevronRightIcon />;
    }

    return (
      <Drawer
        variant="permanent"
        classes={{
          paper: classNames(
            classes.drawerPaper,
            !this.state.open && classes.drawerPaperClose
          )
        }}
        open={this.state.open}
      >
        <ListItem button onClick={this.toggle}>
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary="Minimera" />
        </ListItem>
        <Divider />
        {this.renderTools()}
      </Drawer>
    );
  }
}

Toolbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Toolbar);
