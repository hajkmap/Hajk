import React, { Component } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Divider,
  IconButton
} from "@material-ui/core";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";
import Menu from "@material-ui/icons/Menu";
import "./Toolbar.css";

const drawerWidth = 240;

const styles = theme => ({
  drawer: {
    order: 0,
    zIndex: 10000,
    [theme.breakpoints.down("sm")]: {
      position: "absolute",
      left: 0,
      bottom: 0,
      top: 0
    }
  },
  drawerClose: {
    display: "none"
  },
  drawerPaper: {
    position: "inherit",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: 0
    })
  },
  drawerPaperClose: {
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: 0
    }),
    width: theme.spacing.unit * 7,
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing.unit * 9
    }
  },
  button: {
    marginBottom: "5px"
  },
  menuButton: {
    marginLeft: "-10px"
  }
});

class Toolbar extends Component {
  state = { open: false };

  renderTools() {
    return this.props.tools.map((tool, i) => {
      return (
        <div key={i}>
          <tool.component
            map={tool.map}
            app={tool.app}
            options={tool.options}
            type="toolbarItem"
          />
        </div>
      );
    });
  }

  toggleToolbarText = () => {
    this.setState({ open: !this.state.open });
  };

  toggleToolbar = () => {
    this.setState({
      toolbarOpen: !this.state.toolbarOpen
    });
  };

  renderDrawer() {
    const { classes } = this.props;
    const icon = this.state.open === true ? <ChevronLeft /> : <ChevronRight />;
    if (!document.getElementById("map-overlay")) {
      return null;
    }
    return createPortal(
      <Drawer
        variant="permanent"
        classes={{
          docked: classNames(
            classes.drawer,
            !this.state.toolbarOpen && classes.drawerClose
          ),
          paper: classNames(
            classes.drawerPaper,
            !this.state.open && classes.drawerPaperClose
          )
        }}
        open={this.state.open}
      >
        <ListItem button onClick={this.toggleToolbarText}>
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary="Minimera" />
        </ListItem>
        <Divider />
        {this.renderTools()}
      </Drawer>,
      document.getElementById("map-overlay")
    );
  }

  componentDidMount() {
    // TODO: Get value of toolbarOpen from config
    let toolbarOpen = true;
    this.setState({
      toolbarOpen
    });
  }

  render() {
    const { classes, tools } = this.props;
    if (tools.length === 0) {
      return null;
    }
    return (
      <div>
        <IconButton
          className={classes.menuButton}
          color="inherit"
          aria-label="Menu"
          onClick={this.toggleToolbar}
        >
          <Menu />
        </IconButton>
        {this.renderDrawer()}
      </div>
    );
  }
}

Toolbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Toolbar);
