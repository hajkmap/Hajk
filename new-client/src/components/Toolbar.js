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
import Close from "@material-ui/icons/Close";
import { isMobile } from "../utils/IsMobile.js";

const drawerWidth = "100%";

const styles = theme => ({
  drawer: {
    order: 0,
    zIndex: 1,
    height: "100%",
    [theme.breakpoints.down("md")]: {
      top: 0,
      left: 0,
      bottom: 0,
      width: "100%"
    }
  },
  drawerClose: {
    display: "none"
  },
  drawerPaper: {
    position: "inherit",
    whiteSpace: "nowrap",
    width: drawerWidth
  },
  drawerPaperClose: {
    overflowX: "hidden",
    width: theme.spacing.unit * 7
  },
  button: {
    marginBottom: "5px"
  },
  menuButton: {
    marginLeft: "-10px"
  }
});

class Toolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toolbarOpen: isMobile ? props.open : true,
      open: props.expanded
    };
  }

  itemClicked = e => {
    if (isMobile) {
      this.setState({
        toolbarOpen: false
      });
    }
  };

  renderTools() {
    return this.props.tools.map((tool, i) => {
      return (
        <div key={i} onClick={this.itemClicked}>
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
        {isMobile ? null : (
          <>
            <ListItem button onClick={this.toggleToolbarText}>
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary="Minimera" />
            </ListItem>
            <Divider />
          </>
        )}
        {this.renderTools()}
      </Drawer>,
      document.getElementById(isMobile ? "map-overlay" : "toolbar")
    );
  }

  render() {
    const { classes, tools } = this.props;
    if (tools.length === 0) {
      return null;
    }
    return (
      <div>
        {isMobile ? (
          <IconButton
            className={classes.menuButton}
            color="inherit"
            aria-label="Menu"
            onClick={this.toggleToolbar}
          >
            {this.state.toolbarOpen ? <Close /> : <Menu />}
          </IconButton>
        ) : null}
        {this.renderDrawer()}
      </div>
    );
  }
}

Toolbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Toolbar);
