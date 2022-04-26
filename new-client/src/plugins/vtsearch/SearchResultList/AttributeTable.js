import React from "react";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";
import { withStyles } from "@material-ui/core/styles";
import { SortDirection } from "react-virtualized";
import { MockdataSearchModel } from "./../Mockdata/MockdataSearchModel";

const styles = (theme) => ({});

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
    rows: this.getRows(),
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
    return Object.keys(features[0].properties);
  }

  getRowIndexFromOlFeatureId = (olFeatureId) => {
    return this.state.rows
      .map((row) => {
        return row.olFeatureId;
      })
      .indexOf(olFeatureId);
  };

  #init = () => {
    this.showStopPoints = false;
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
    localObserver.subscribe("vt-show-stop-points-by-line", (showStopPoints) => {
      this.showStopPoints = showStopPoints;
    });
  };

  getDisplayName = (key) => {
    const { toolConfig, searchResult } = this.props;
    var attributesMappingArray =
      toolConfig.geoServer[searchResult.type]?.attributesToDisplay;

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

  getColumns() {
    const { searchResult, toolConfig } = this.props;

    let propertyKeys = this.getFeaturePropertiesKeys(searchResult);
    let attributeDisplayOrder =
      toolConfig.geoServer[searchResult.type]?.attributesToDisplay;
    propertyKeys = this.reorderPropertyKeys(
      attributeDisplayOrder,
      propertyKeys
    );

    return propertyKeys.map((key) => {
      var displayName = this.getDisplayName(key);
      console.log(displayName, "displayName");
      return {
        label: displayName || key,
        dataKey: key,
        width: 300,
      };
    });
  }

  getRows() {
    const { searchResult } = this.props;
    const features = this.getFeaturesFromSearchResult(searchResult);
    return features.map((feature, index) => {
      return Object.keys(feature.properties).reduce(
        (acc, key) => {
          return { ...acc, [key]: feature.properties[key] };
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

  // Lägg in en label från toolconfig i searchresult
  render() {
    const { height, searchResult, rowHeight } = this.props;
    const features = this.getFeaturesFromSearchResult(searchResult);
    return (
      <Paper style={{ height: height }}>
        {features.length > 0 ? (
          <VirtualizedTable
            rowCount={this.state.rows.length}
            rowGetter={({ index }) => this.state.rows[index]}
            rowClicked={this.onRowClick}
            columns={this.getColumns()}
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
