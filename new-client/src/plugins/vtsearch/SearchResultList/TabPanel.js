// Generic imports â€“ all plugins need these
import React from "react";
import PropTypes from "prop-types";
import AttributeTable from "./AttributeTable";
import { withStyles } from "@material-ui/core/styles";
import SummaryTable from "./SummaryTable";
import Grid from "@material-ui/core/Grid";

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

class TabPanel extends React.PureComponent {
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
      resultListHeight,
      searchResult,
      localObserver
    } = this.props;

    var renderSummary = false;
    //searchResult.label === "Hållplatsområden" ? true : false; //TODO - DEBUG ONLY

    return (
      <Grid
        hidden={value !== index}
        id={`search-result-${index}`}
        container
        alignContent="stretch"
        alignItems="flex-start"
        spacing={0}
      >
        {renderSummary && (
          <Grid item xs={3}>
            <SummaryTable
              localObserver={localObserver}
              resultListHeight={resultListHeight}
            ></SummaryTable>
          </Grid>
        )}
        <Grid item xs={renderSummary ? 9 : 12}>
          <AttributeTable
            searchResult={searchResult}
            resultListHeight={resultListHeight}
            localObserver={localObserver}
          ></AttributeTable>
        </Grid>
      </Grid>
    );
  }
}

// Part of API. Make a HOC of our plugin.
export default withStyles(styles)(TabPanel);
