import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import ListIcon from "@material-ui/icons/List";
import "./Toolbar.css"; // TODO: Move styles to JSS and remove the CSS file

const styles = theme => ({
  toolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(255, 255, 255, 1)",
    zIndex: "1002",
    height: "60px",
    display: "flex",
    flexFlow: "no-wrap",
    alignItems: "center",
    justifyContent: "center",
    transitionDuration: "0.3s"
  },
  toolbarToggler: {
    display: "none"
  }
});
class Toolbar extends Component {
  state = {};

  renderTools() {
    return this.props.tools.map((tool, i) => {
      return <tool.component key={i} tool={tool} toolbar={this} />;
    });
  }

  hide() {
    this.setState({
      toolbarVisible: false
    });
  }

  toggleToolbar() {
    this.setState({
      toolbarVisible: !this.state.toolbarVisible
    });
  }

  render() {
    var classes = this.props.classes;
    classes += this.state.toolbarVisible ? "toolbar visible" : "toolbar";
    if (this.props.tools.length === 0) {
      return null;
    }
    return (
      // FIXME: Small screens must display tools vertically, make this toggle button work again.
      <div id="toolbar-group">
        <div
          className={classes.toolbarToggler}
          onClick={() => {
            this.toggleToolbar();
          }}
        >
        <ListIcon />
        </div>
        <div id="toolbar" className={classes.toolbar}>
          {this.renderTools()}
        </div>
      </div>
    );
  }
}

Toolbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Toolbar);
