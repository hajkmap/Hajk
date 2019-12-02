// Generic imports â€“ all plugins need these
import React from "react";
import PropTypes from "prop-types";
import { Rnd } from "react-rnd";
import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Container from "@material-ui/core/Container";
import Observer from "react-event-observer";
import { Typography } from "@material-ui/core";
import ReactDOM from "react-dom";

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

const styles = theme => {};

class SearchResultListContainer extends React.PureComponent {
  state = {};

  static propTypes = {
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { value, index } = this.props;
    console.log(index, "index");
    return (
      <Container hidden={value !== index} id={`search-result-${index}`}>
        {this.props.children}
      </Container>
    );
  }
}

// Part of API. Make a HOC of our plugin.
export default withStyles(styles)(SearchResultListContainer);
