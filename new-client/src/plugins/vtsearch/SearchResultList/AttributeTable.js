import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";
import { SortDirection } from "react-virtualized";

const styles = theme => ({});

var rows = [];

class AttributeTable extends React.Component {
  state = {
    selectedRowIndex: null,
    rows: this.getRows()
  };

  constructor(props) {
    super(props);
    this.bindSubscriptions();
  }

  getFeaturePropertiesKeys(searchResult) {
    return Object.keys(searchResult.featureCollection.features[0].properties);
  }

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("highlight-attribute-row", id => {
      var foundRowIndex = rows
        .map(row => {
          return row.id;
        })
        .indexOf(id);
      this.setState({ selectedRowIndex: foundRowIndex });
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
  /*
   */
  sort = ({ sortBy, sortDirection }) => {
    var rowsToBeSorted = this.state.rows;

    rowsToBeSorted.sort(function(a, b) {
      return a[sortBy].localeCompare(b[sortBy]);
    });

    rowsToBeSorted =
      sortDirection === SortDirection.DESC
        ? rowsToBeSorted.reverse()
        : rowsToBeSorted;

    this.setState({
      sortBy,
      sortDirection,
      rows: rowsToBeSorted
    });
  };

  onRowClick = row => {
    const { localObserver } = this.props;

    this.setState({ selectedRowIndex: row.index });
    localObserver.publish("attribute-table-row-clicked", row.rowData.id);
  };

  render() {
    const { resultListHeight, windowWidth } = this.props;

    return (
      <Paper style={{ height: resultListHeight, width: windowWidth }}>
        <VirtualizedTable
          rowCount={this.state.rows.length}
          rowGetter={({ index }) => this.state.rows[index]}
          rowClicked={this.onRowClick}
          columns={this.getColumns()}
          windowWidth={windowWidth}
          sort={this.sort}
          sortDirection={this.state.sortDirection}
          sortBy={this.state.sortBy}
          selectedRowIndex={this.state.selectedRowIndex}
        />
      </Paper>
    );
  }
}

export default withStyles(styles)(AttributeTable);
