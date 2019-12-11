// Generic imports â€“ all plugins need these
import React from "react";
import PropTypes from "prop-types";
import AttributeTable from "./AttributeTable";
import { withStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

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
    containerRoot: {
      padding: 0,
      margin: 0,
      maxWidth: "none"
    }
  };
};

class SearchResultListContainer extends React.PureComponent {
  state = {};

  static propTypes = {
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  render() {
    const {
      value,
      index,
      classes,
      resultListHeight,
      searchResult,
      localObserver,
      windowWidth
    } = this.props;
    return (
      <Container
        classes={{ root: classes.containerRoot }}
        hidden={value !== index}
        id={`search-result-${index}`}
      >
        <AttributeTable
          searchResult={searchResult}
          resultListHeight={resultListHeight}
          windowWidth={windowWidth}
          localObserver={localObserver}
        ></AttributeTable>
      </Container>
    );
  }
}

// Part of API. Make a HOC of our plugin.
export default withStyles(styles)(SearchResultListContainer);
