// Generic imports – all plugins need these
import React from "react";
import PropTypes from "prop-types";
import { Rnd } from "react-rnd";
import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";

import Box from "@material-ui/core/Box";
import Observer from "react-event-observer";

/**
 * @summary Main class for the Dummy plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 * The plugins can also serve as a scaffold for other plugins: simply
 * copy the directory, rename it and all files within, and change logic
 * to create the plugin you want to.
 *
 * @class Dummy
 * @extends {React.PureComponent}
 */

const styles = theme => {
  return {
    window: {
      zIndex: 100,

      background: "white",
      boxShadow:
        "2px 2px 2px rgba(0, 0, 0, 0.4), 0px 0px 4px rgba(0, 0, 0, 0.4)",
      borderRadius: "5px",
      overflow: "hidden",
      pointerEvents: "all"
    }
  };
};

const { height: windowHeight, width: windowWidth } = document
  .getElementById("windows-container")
  .getClientRects()[0];

class SearchResultListContainer extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.

  state = {
    resultListHeight: 200,
    windowWidth: windowWidth,
    windowHeight: windowHeight,
    value: 1
  };

  static propTypes = {
    app: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    resultListHeight: 200,
    resultListWidth: 2000,
    options: {}
  };

  constructor(props) {
    // Unsure why we write "super(props)"?
    // See https://overreacted.io/why-do-we-write-super-props/ for explanation.
    super(props);

    // We can setup a local observer to allow sending messages between here (controller) and model/view.
    // It's called 'localObserver' to distinguish it from AppModel's globalObserver.
    // API docs, see: https://www.npmjs.com/package/react-event-observer
    this.localObserver = Observer();

    window.addEventListener("resize", x => {
      const {
        height: windowHeight,
        width: windowWidth
      } = document.getElementById("windows-container").getClientRects()[0];
      this.setState({ windowWidth: windowWidth, windowHeight: windowHeight });
    });
  }

  handleTabChange = (event, newValue) => {
    this.setState({ value: newValue });
  };

  renderTabComponent = props => {
    const { value, index } = props;
    return (
      <Container
        component="div"
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
      ></Container>
    );
  };

  renderTab = (label, id) => {
    return (
      <Tab
        label={label}
        id={`search-result-${1}`}
        aria-controls={`simple-tabpanel-${1}`}
      />
    );
  };

  renderTabs = () => {
    return (
      <>
        <AppBar position="static">
          <Tabs
            value={this.state.value}
            onChange={this.handleTabChange}
            aria-label="simple tabs example"
          >
            {this.renderTab("Test1", 1)}
            {this.renderTab("Test2", 2)}
          </Tabs>
        </AppBar>
      </>
    );
  };

  renderSearchResultContainer = () => {
    const { classes } = this.props;

    return (
      <Rnd
        className={classes.window}
        size={{
          width: this.state.windowWidth,
          height: this.state.resultListHeight
        }}
        position={{
          x: 0,
          y: this.state.windowHeight - this.state.resultListHeight
        }}
        ref={c => {
          this.rnd = c;
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          var height = ref.style.height.substring(
            0,
            ref.style.height.length - 2
          );
          this.setState({
            resultListHeight: parseInt(height)
          });
        }}
        bounds={"#window-container"}
        disableDragging
        enableResizing={{
          bottom: false,
          bottomLeft: false,
          bottomRight: false,
          left: false,
          right: false,
          top: true,
          topLeft: false,
          topRight: false
        }}
      >
        {this.renderTabs()}
      </Rnd>
    );
  };
  render() {
    return this.renderSearchResultContainer();
  }
}

// Part of API. Make a HOC of our plugin.
export default withStyles(styles)(SearchResultListContainer);
