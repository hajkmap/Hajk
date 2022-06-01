import React from "react";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";
import { withStyles } from "@material-ui/core/styles";
import { SortDirection } from "react-virtualized";
import { MockdataSearchModel } from "./../Mockdata/MockdataSearchModel";
import { CSVDownload } from "react-csv";

const styles = (theme) => ({
  cvsLinkComponent: { color: "orange" },
});

/**
 * @summary Attribute table for objects in the map
 * @description Table with functionality to interact with the map
 * the class is a wrapper around the VirtualizedTable class which uses
 * React Virtualized to render large lists in a smart way to boost performance
 * @class Attributetable
 * @extends {React.Component}
 */

class AttributeTable extends React.Component {
  state = {
    selectedRow: {
      index: null,
      olFeatureId: null,
    },
    sortBy:
      this.props.toolConfig.geoServer[
        this.props.searchResult.type
      ]?.defaultSortOrder.slice(-1)[0],
    sortOrder:
      this.props.toolConfig.geoServer[this.props.searchResult.type]
        ?.defaultSortOrder,
    focusedRow: 0,
    rows: this.getRows(this.props.searchResult),
    exportCsvFile: false,
  };

  //Most efficient way to do it?
  componentDidMount() {
    if (this.state.rows.length > 0) {
      if (!this.state.sortOrder) {
        const sortOrder = MockdataSearchModel();
        this.setState({
          sortOrder:
            MockdataSearchModel()[this.props.searchResult.type]
              .defaultSortOrder,
        });
      }
      this.state.sortOrder.map((sortAttribute) => {
        this.sort({
          sortBy: sortAttribute,
          sortDirection: SortDirection.ASC,
        });
        return null;
      });
    }
  }

  constructor(props) {
    super(props);
    this.#init();
    this.#bindSubscriptions();
  }

  getFeaturePropertiesKeys(searchResult) {
    const features = this.getFeaturesFromSearchResult(searchResult);
    const properties = features[0].properties
      ? features[0].properties
      : features[0].getProperties();
    return Object.keys(properties);
  }

  getRowIndexFromOlFeatureId = (olFeatureId) => {
    return this.state.rows
      .map((row) => {
        return row.olFeatureId;
      })
      .indexOf(olFeatureId);
  };

  #init = () => {
    this.showStopPoints = true;
  };

  #bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("vt-remove-highlight-attribute-row", () => {
      this.setState({
        selectedRow: { index: null, olFeatureId: null },
      });
    });
    localObserver.subscribe("vt-highlight-attribute-row", (olFeatureId) => {
      var foundRowIndex = this.getRowIndexFromOlFeatureId(olFeatureId);
      this.setState({
        selectedRow: { index: foundRowIndex, olFeatureId: olFeatureId },
        focusedRow: foundRowIndex,
      });
    });
    localObserver.subscribe("vt-export-search-result-list-done", (result) => {
      this.exportList = result;
      this.#exportSearchResult();
    });
    if (this.showStopPoints)
      localObserver.subscribe(
        "vt-show-stop-points-by-line",
        (showStopPoints) => {
          this.showStopPoints = showStopPoints;
        }
      );
  };

  #getExportHeaders = () => {
    let columns = this.getColumns(this.exportList);
    return columns.map((value) => {
      return { label: value.label, key: value.dataKey };
    });
  };

  #getExportList = () => {
    return this.getRows(this.exportList);
  };

  #exportSearchResult = () => {
    //The download csv component will download only when rendered, so it needs to
    //be removed and then readded to trigger the download. Otherwise download will
    //only be possible the first time the download button is clicked
    this.setState({ exportCsvFile: false });
    this.setState({ exportCsvFile: true });
  };

  getDisplayName = (key, resultList) => {
    const { toolConfig } = this.props;
    var attributesMappingArray =
      //toolConfig.geoServer[searchResult.type]?.attributesToDisplay;
      toolConfig.geoServer[resultList.type]?.attributesToDisplay;

    var displayName = attributesMappingArray?.find((entry) => {
      return entry.key === key;
    }).displayName;
    return displayName;
  };

  /**
   * Private method that reorders the property keys in the attribute table so that they match
   * the order in the tool config.
   * @param {Array} attributeDisplayOrder The display order for this search result.
   * @param {object} propertyKeys The property keys from feature collection with the search result in it.
   *
   * @memberof AttributeTable
   */
  reorderPropertyKeys = (attributeDisplayOrder, propertyKeys) => {
    if (!attributeDisplayOrder) return propertyKeys;

    let newDisplayOrder = attributeDisplayOrder.map((attribute) => {
      if (propertyKeys.includes(attribute.key)) return attribute.key;
      return null;
    });

    return newDisplayOrder;
  };

  getColumns(resultList) {
    const { toolConfig } = this.props;

    let propertyKeys = this.getFeaturePropertiesKeys(resultList);
    let attributeDisplayOrder =
      toolConfig.geoServer[resultList.type]?.attributesToDisplay;
    propertyKeys = this.reorderPropertyKeys(
      attributeDisplayOrder,
      propertyKeys
    );
    propertyKeys = propertyKeys.filter((propertyKey) => {
      return propertyKey !== null;
    });

    return propertyKeys.map((key) => {
      var displayName = this.getDisplayName(key, resultList);
      console.log(displayName, "displayName");
      return {
        label: displayName || key,
        dataKey: key,
        width: 300,
      };
    });
  }

  getRows(resultList) {
    const { searchResult } = this.props;
    const features = this.getFeaturesFromSearchResult(resultList);
    return features.map((feature, index) => {
      const properties = feature.properties
        ? feature.properties
        : feature.getProperties();
      return Object.keys(properties).reduce(
        (acc, key) => {
          return { ...acc, [key]: properties[key] };
        },
        { olFeatureId: feature.id, searchResultId: searchResult.id }
      );
    });
  }

  /**
   * Gets all features from a search result. The result will differ if it's from core or from the vtsearch plugin.
   */
  getFeaturesFromSearchResult(searchResult) {
    return (
      searchResult?.value?.features || searchResult?.featureCollection?.features
    );
  }

  sortNulls = (compareOne, compareTwo) => {
    if (compareOne === null && compareTwo !== null) {
      return 1;
    } else if (compareOne !== null && compareTwo === null) {
      return -1;
    } else if (compareOne === compareTwo) {
      return 0;
    }
  };

  sortAlphaNumerical = (compareOne, compareTwo) => {
    var compareOneString;
    var compareTwoString;
    var compareOneChar;
    var compareTwoChar;
    var i = 0;
    var n = null;
    var length = null;
    var regex = /(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;

    if (compareOne === compareTwo) return 0;

    compareOneString = compareOne.toString().toLowerCase().match(regex);

    compareTwoString = compareTwo.toString().toLowerCase().match(regex);

    length = compareOneString.length;

    while (i < length) {
      if (!compareTwoString[i]) return 1;

      compareOneChar = compareOneString[i];
      compareTwoChar = compareTwoString[i++];

      if (compareOneChar !== compareTwoChar) {
        n = compareOneChar - compareTwoChar;
        if (!isNaN(n)) return n;

        return compareOneChar > compareTwoChar ? 1 : -1;
      }
    }

    return compareTwoString[i] ? -1 : 0;
  };

  sort = ({ sortBy, sortDirection }) => {
    var compareOne = null;
    var compareTwo = null;
    var rowsToBeSorted = this.state.rows;
    var sortByNumber = typeof rowsToBeSorted[0][sortBy] === "number";

    if (sortByNumber) {
      rowsToBeSorted.sort((a, b) => {
        compareOne = a[sortBy] === "" ? null : a[sortBy]; //Handle empty string same way as null
        compareTwo = b[sortBy] === "" ? null : b[sortBy]; //Handle empty string same way as null
        return parseFloat(compareOne) - parseFloat(compareTwo);
      });
    } else {
      rowsToBeSorted.sort((a, b) => {
        compareOne = a[sortBy] === "" ? null : a[sortBy]; //Handle empty string same way as null
        compareTwo = b[sortBy] === "" ? null : b[sortBy]; //Handle empty string same way as null
        if (compareOne !== null && compareTwo !== null) {
          return this.sortAlphaNumerical(compareOne, compareTwo);
        } else {
          return this.sortNulls(compareOne, compareTwo);
        }
      });
    }

    rowsToBeSorted =
      sortDirection === SortDirection.DESC
        ? rowsToBeSorted.reverse()
        : rowsToBeSorted;

    this.setState((state) => {
      return {
        sortBy,
        sortDirection,
        rows: rowsToBeSorted,
        selectedRow: {
          index: this.getRowIndexFromOlFeatureId(state.selectedRow.id),
          olFeatureId: state.selectedRow.olFeatureId,
        },
      };
    });
  };

  onRowClick = (row) => {
    const { localObserver, searchResult } = this.props;
    this.setState({
      selectedRow: { index: row.index, olFeatureId: row.rowData.olFeatureId },
    });
    localObserver.publish("vt-attribute-table-row-clicked", {
      olFeatureId: row.rowData.olFeatureId,
      searchResultId: searchResult.id,
    });
    //if (this.showStopPoints)
    localObserver.publish("vt-search-stop-points-by-line", {
      internalLineNumber: row.rowData.InternalLineNumber,
      direction: row.rowData.Direction,
    });
  };

  #renderCSVDownloadComponent = () => {
    return (
      <CSVDownload
        data={this.#getExportList()}
        headers={this.#getExportHeaders()}
        filename="DL-csv-attrtable.csv"
        target="_blank"
      />
    );
  };

  // Lägg in en label från toolconfig i searchresult
  render() {
    const { height, searchResult, rowHeight } = this.props;
    const features = this.getFeaturesFromSearchResult(searchResult);
    return (
      <Paper style={{ height: height }}>
        {this.state.exportCsvFile && this.#renderCSVDownloadComponent()}
        {features.length > 0 ? (
          <VirtualizedTable
            rowCount={this.state.rows.length}
            rowGetter={({ index }) => this.state.rows[index]}
            rowClicked={this.onRowClick}
            columns={this.getColumns(searchResult)}
            sort={this.sort}
            sortDirection={this.state.sortDirection}
            sortBy={this.state.sortBy}
            scrollToIndex={this.state.focusedRow}
            scrollToAlignment="center"
            selectedRow={this.state.selectedRow}
            rowHeight={rowHeight}
          />
        ) : (
          <Paper style={{ height: height }}>Inga sökresultat</Paper>
        )}
      </Paper>
    );
  }
}

export default withStyles(styles)(AttributeTable);
