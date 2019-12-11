import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";

const styles = theme => ({});

class AttributeTable extends React.PureComponent {
  getFeaturePropertiesKeys(searchResult) {
    return Object.keys(searchResult.featureCollection.features[0].properties);
  }
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

  onRowClick = row => {
    const { localObserver } = this.props;
    localObserver.publish("attribute-table-row-clicked", row.rowData.id);
  };

  render() {
    const { resultListHeight, windowWidth } = this.props;
    var rows = this.getRows();
    return (
      <Paper style={{ height: resultListHeight, width: windowWidth }}>
        <VirtualizedTable
          rowCount={rows.length}
          rowGetter={({ index }) => rows[index]}
          rowClicked={this.onRowClick}
          columns={this.getColumns()}
          windowWidth={windowWidth}
        />
      </Paper>
    );
  }
}

export default withStyles(styles)(AttributeTable);
