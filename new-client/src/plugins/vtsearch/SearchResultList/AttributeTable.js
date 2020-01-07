import React from "react";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";
import { withStyles } from "@material-ui/core/styles";
import { SortDirection } from "react-virtualized";

const styles = theme => ({});

class AttributeTable extends React.Component {
  state = {
    selectedRow: {
      index: null,
      id: null
    },
    focusedRow: 0,
    rows: this.getRows()
  };

  constructor(props) {
    super(props);
    this.bindSubscriptions();
  }

  getFeaturePropertiesKeys(searchResult) {
    return Object.keys(searchResult.featureCollection.features[0].properties);
  }

  getRowIndexFromRowId = id => {
    return this.state.rows
      .map(row => {
        return row.id;
      })
      .indexOf(id);
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("highlight-attribute-row", olFeatureId => {
      var foundRowIndex = this.getRowIndexFromRowId(olFeatureId);
      this.setState({
        selectedRow: { index: foundRowIndex, id: olFeatureId },
        focusedRow: foundRowIndex
      });
    });
  };

  getColumns() {
    const { searchResult } = this.props;

    return this.getFeaturePropertiesKeys(searchResult).map(key => {
      return {
        width: 200,
        label: key,
        dataKey: key
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
        { id: feature.id }
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
    var sortByNumber = isNaN(parseFloat(rowsToBeSorted[0][sortBy]))
      ? false
      : true;

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
          index: this.getRowIndexFromRowId(state.selectedRow.id),
          id: state.selectedRow.id
        }
      };
    });
  };

  onRowClick = row => {
    const { localObserver, searchResult } = this.props;
    this.setState({ selectedRow: { index: row.index, id: row.rowData.id } });
    localObserver.publish("attribute-table-row-clicked", {
      olFeatureId: row.rowData.id,
      searchResultId: searchResult.id
    });
  };

  render() {
    const { resultListHeight, windowWidth, searchResult } = this.props;
    return (
      <Paper style={{ height: resultListHeight }}>
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
          />
        ) : (
          <Paper
            style={{ height: resultListHeight, width: windowWidth }}
          ></Paper>
        )}
      </Paper>
    );
  }
}

export default withStyles(styles)(AttributeTable);
