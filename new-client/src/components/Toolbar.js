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
  IconButton
} from "@material-ui/core";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";
import Menu from "@material-ui/icons/Menu";
import Close from "@material-ui/icons/Close";
import { isMobile, getIsMobile } from "../utils/IsMobile.js";

const drawerWidth = "100%";

const styles = theme => {
  return {
    drawer: {
      order: 0,
      zIndex: 1,
      height: "calc(100vh - 64px)",
      [theme.breakpoints.down("xs")]: {
        top: 0,
        left: 0,
        bottom: 0,
        position: "absolute",
        width: "100%",
        zIndex: 10
      }
    },
    drawerClose: {
      display: "none"
    },
    drawerPaper: {
      position: "inherit",
      whiteSpace: "nowrap",
      borderRight: "none",
      [theme.breakpoints.down("xs")]: {
        width: drawerWidth
      }
    },
    drawerPaperClose: {
      borderRight: "none",
      overflowX: "hidden",
      width: theme.spacing(8),
      [theme.breakpoints.down("xs")]: {
        width: drawerWidth
      }
    },
    button: {
      marginBottom: "5px"
    },
    toolItem: {},
    toggler: {
      height: "47px",
      [theme.breakpoints.down("xs")]: {
        display: "none"
      }
    },
    menuButton: {
      display: "none",
      [theme.breakpoints.down("xs")]: {
        display: "block"
      }
    }
  };
};

class Toolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toolbarOpen: isMobile ? props.open : true,
      open: props.expanded
    };
    props.globalObserver.on("widgetItemClicked", e => {
      this.itemClicked();
    });
    window.addEventListener("resize", e => {
      if (window.innerWidth > 600) {
        if (!this.state.toolbarOpen) {
          this.setState({
            toolbarOpen: true
          });
        }
      } else {
        if (this.state.toolbarOpen) {
          this.setState({
            toolbarOpen: false
          });
        }
      }
    });
  }

  itemClicked = e => {
    if (getIsMobile()) {
      this.setState({
        toolbarOpen: false
      });
    }
  };

  renderTools() {
    const { classes } = this.props;
    return this.props.tools.map((tool, i) => {
      return (
        <div key={i} onClick={this.itemClicked} className={classes.toolItem}>
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
    this.props.globalObserver.publish("toolbarExpanded", !this.state.open);
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

    return (
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
        <div>
          <ListItem
            button
            divider={true}
            onClick={this.toggleToolbarText}
            className={classes.toggler}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary="Minimera" />
          </ListItem>
        </div>
        {this.renderTools()}
        {this.props.widgets || null}
      </Drawer>
    );
  }

  renderToggler() {
    const { classes } = this.props;
    return createPortal(
      <IconButton
        className={classes.menuButton}
        color="inherit"
        aria-label="Menu"
        onClick={this.toggleToolbar}
      >
        {this.state.toolbarOpen ? <Close /> : <Menu />}
      </IconButton>,
      document.getElementById("tools-toggler")
    );
  }

  render() {
    const { tools } = this.props;
    if (tools.length === 0) {
      return null;
    }
    return (
      <div>
        {this.renderToggler()}
        {this.renderDrawer()}
      </div>
    );
  }
}

Toolbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Toolbar);
