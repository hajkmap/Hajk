// Generic imports â€“ all plugins need these
import React from "react";
import PropTypes from "prop-types";
import AttributeTable from "./AttributeTable";
import SummaryTable from "./SummaryTable";
import Grid from "@material-ui/core/Grid";

/**
 * @summary Panel for handling multiple search result using tabs
 * @description Panel handles multiple search results with tabs.
 * Every tab maps to a searchresultId
 * @class TabPanel
 * @extends {React.PureComponent}
 */

const rowHeight = 30;

class TabPanel extends React.PureComponent {
  static propTypes = {
    activeTabId: PropTypes.number.isRequired,
    tabId: PropTypes.number.isRequired
  };

  render() {
    const {
      activeTabId,
      resultListHeight,
      searchResult,
      tabId,
      localObserver,
      toolConfig
    } = this.props;

    var renderSummary = searchResult.type === "journeys" ? true : false;

    return (
      <Grid
        style={{ display: activeTabId !== tabId ? "none" : "block" }}
        container
        alignContent="stretch"
        alignItems="flex-start"
        spacing={0}
      >
        {renderSummary && (
          <Grid item xs={12}>
            <SummaryTable
              localObserver={localObserver}
              height={100}
              searchResult={searchResult}
              rowHeight={rowHeight}
            ></SummaryTable>
          </Grid>
        )}
        <Grid item xs={12}>
          <AttributeTable
            searchResult={searchResult}
            toolConfig={toolConfig}
            resultListHeight={resultListHeight}
            localObserver={localObserver}
            rowHeight={rowHeight}
          ></AttributeTable>
        </Grid>
      </Grid>
    );
  }
}

export default TabPanel;
