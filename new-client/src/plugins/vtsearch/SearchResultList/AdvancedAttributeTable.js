import React from "react";
import { withStyles } from "@material-ui/core/styles";

import AttributeTable from "./AttributeTable";
import SummaryTable from "./SummaryTable";
import { CSVDownload } from "react-csv";

const styles = (theme) => ({
  paper: { height: 240, marginBottom: 10, boxShadow: "none" },
});

/**
 * @summary Table used to show summary for journeys
 * @description Table used to show a summary when the user search
 * for the type Journeys
 * @class SummaryTable
 * @extends {React.Component}
 */
class AdvancedAttributeTable extends React.Component {
  state = {
    rows: this.getRows(),
    summaryHeight: this.getSummarizationHeight(),
    exportCsvFile: false,
  };

  constructor(props) {
    super(props);
    this.#bindSubscriptions();
  }

  #bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("vt-export-search-journey-summary-table", () => {
      this.#exportSearchResult();
    });
  };

  #exportSearchResult = () => {
    //The download csv component will download only when rendered, so it needs to
    //be removed and then readded to trigger the download. Otherwise download will
    //only be possible the first time the download button is clicked
    this.setState({ exportCsvFile: false });
    this.setState({ exportCsvFile: true });
  };

  #getExportHeaders = () => {
    let columns = this.getColumns();
    return columns.map((value) => {
      return { label: value.label, key: value.dataKey };
    });
  };

  getSummarizationHeight() {
    const { rowHeight } = this.props;
    return this.getSummarization().length * rowHeight + 50;
  }

  getColumns() {
    const { windowWidth } = this.props;
    return [
      {
        width: 300,
        label: "TRAFIKFÖRETAG",
        dataKey: "operator",
      },
      { width: windowWidth - 300, label: "LINJER", dataKey: "lines" },
    ];
  }

  getConcatenatedLinesString({ publicLineNames, internalLineNumbers }) {
    return ` ${publicLineNames.map((name, index) => {
      return ` ${name} (${internalLineNumbers[index]})`;
    })}`;
  }

  getRows() {
    return this.getSummarization().map((transportCompany) => {
      return {
        operator: transportCompany.transportCompany,
        lines: this.getConcatenatedLinesString(transportCompany),
      };
    });
  }

  getDistinctTransportCompanies() {
    const { searchResult } = this.props;
    return Array.from(
      new Set(
        searchResult.featureCollection.features.map((feature) => {
          return feature.properties.TransportCompany;
        })
      )
    );
  }

  getTransportCompaniesWithLinesAdded(transportCompany) {
    const { searchResult } = this.props;

    var transportCompaniesAndTheirLines = {
      publicLineNames: [],
      internalLineNumbers: [],
      transportCompany: transportCompany,
    };
    searchResult.featureCollection.features.forEach((feature) => {
      const { PublicLineName, InternalLineNumber } = feature.properties;
      if (feature.properties.TransportCompany === transportCompany) {
        if (
          transportCompaniesAndTheirLines.publicLineNames.indexOf(
            PublicLineName
          ) === -1 &&
          transportCompaniesAndTheirLines.internalLineNumbers.indexOf(
            InternalLineNumber
          ) === -1
        ) {
          transportCompaniesAndTheirLines.publicLineNames.push(
            feature.properties.PublicLineName
          );
          transportCompaniesAndTheirLines.internalLineNumbers.push(
            feature.properties.InternalLineNumber
          );
        }
      }
    });
    return transportCompaniesAndTheirLines;
  }

  getSummarization() {
    var summary = [];
    this.getDistinctTransportCompanies().forEach((transportCompany) => {
      summary.push(this.getTransportCompaniesWithLinesAdded(transportCompany));
    });
    return summary;
  }

  #renderCSVDownloadComponent = () => {
    return (
      <CSVDownload
        data={this.getRows()}
        headers={this.#getExportHeaders()}
        filename="kartsidanExport_summaryTable.csv"
        target="_self"
      />
    );
  };

  render = () => {
    const {
      toolConfig,
      attributeTableContainerHeight,
      localObserver,
      searchResult,
    } = this.props;

    return (
      <>
        <SummaryTable
          localObserver={localObserver}
          height={this.state.summaryHeight}
          rows={this.getRows()}
          columns={this.getColumns()}
          searchResult={searchResult}
        ></SummaryTable>
        <AttributeTable
          searchResult={searchResult}
          toolConfig={toolConfig}
          height={attributeTableContainerHeight - this.state.summaryHeight}
          localObserver={localObserver}
        ></AttributeTable>
      </>
    );
  };
}

export default withStyles(styles)(AdvancedAttributeTable);
