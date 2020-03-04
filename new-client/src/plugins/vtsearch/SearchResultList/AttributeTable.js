import React from "react";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";
import { withStyles } from "@material-ui/core/styles";
import { SortDirection } from "react-virtualized";

const styles = theme => ({});

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
      olFeatureId: null
    },
    sortBy: this.props.toolConfig.geoServer[this.props.searchResult.type]
      .defaultSortAttribute,
    focusedRow: 0,
    rows: this.getRows()
  };

  //Most efficient way to do it?
  componentDidMount() {
    if (this.state.rows.length > 0) {
      this.sort({
        sortBy: this.state.sortBy,
        sortDirection: SortDirection.ASC
      });
    }
  }

  constructor(props) {
    super(props);
    this.bindSubscriptions();
  }

  getFeaturePropertiesKeys(searchResult) {
    return Object.keys(searchResult.featureCollection.features[0].properties);
  }

  getRowIndexFromOlFeatureId = olFeatureId => {
    return this.state.rows
      .map(row => {
        return row.olFeatureId;
      })
      .indexOf(olFeatureId);
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("remove-highlight-attribute-row", () => {
      this.setState({
        selectedRow: { index: null, olFeatureId: null }
      });
    });
    localObserver.subscribe("highlight-attribute-row", olFeatureId => {
      var foundRowIndex = this.getRowIndexFromOlFeatureId(olFeatureId);
      localObserver.publish(
        "set-active-tab",
        this.state.rows[foundRowIndex].searchResultId
      );
      this.setState({
        selectedRow: { index: foundRowIndex, olFeatureId: olFeatureId },
        focusedRow: foundRowIndex
      });
    });
  };

  getDisplayName = key => {
    const { toolConfig, searchResult } = this.props;
    var attributesMappingArray =
      toolConfig.geoServer[searchResult.type].attributesToDisplay;

    var displayName = attributesMappingArray.find(entry => {
      return entry.key === key;
    }).displayName;
    return displayName;
  };

  getColumns() {
    const { searchResult } = this.props;
    return this.getFeaturePropertiesKeys(searchResult).map(key => {
      var displayName = this.getDisplayName(key);
      console.log(displayName, "displayName");
      return {
        label: displayName || key,
        dataKey: key,
        width: 300
      };
    });
  }
  getRows() {
    const { searchResult } = this.props;
    return searchResult.featureCollection.features.map((feature, index) => {
      return Object.keys(feature.properties).reduce(
        (acc, key) => {
          return { ...acc, [key]: feature.properties[key] };
        },
        { olFeatureId: feature.id, searchResultId: searchResult.id }
      );
    });
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
          return compareOne.localeCompare(compareTwo);
        } else {
          return this.sortNulls(compareOne, compareTwo);
        }
      });
    }

    rowsToBeSorted =
      sortDirection === SortDirection.DESC
        ? rowsToBeSorted.reverse()
        : rowsToBeSorted;

    this.setState(state => {
      return {
        sortBy,
        sortDirection,
        rows: rowsToBeSorted,
        selectedRow: {
          index: this.getRowIndexFromOlFeatureId(state.selectedRow.id),
          olFeatureId: state.selectedRow.olFeatureId
        }
      };
    });
  };

  onRowClick = row => {
    const { localObserver, searchResult } = this.props;
    this.setState({
      selectedRow: { index: row.index, olFeatureId: row.rowData.olFeatureId }
    });
    localObserver.publish("attribute-table-row-clicked", {
      olFeatureId: row.rowData.olFeatureId,
      searchResultId: searchResult.id
    });
  };

  render() {
    const { height, searchResult, rowHeight } = this.props;

    return (
      <Paper style={{ height: height }}>
        {searchResult.featureCollection.features.length > 0 ? (
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
