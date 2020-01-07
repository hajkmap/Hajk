import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";
const styles = theme => ({});

class AttributeTable extends React.Component {
  state = {
    rows: this.getRows()
  };

  getColumns() {
    return [
      {
        width: 200,
        label: "Operatör",
        dataKey: "operator"
      },
      {
        width: 200,
        label: "Linjer",
        dataKey: "lines"
      }
    ];
  }

  getRows() {
    return [{ id: 0, operator: "SJ Götalandståg", lines: "TÅG" }];
  }

  render() {
    const { resultListHeight, windowWidth } = this.props;

    return (
      <Paper style={{ height: resultListHeight, width: windowWidth }}>
        <VirtualizedTable
          rowCount={this.state.rows.length}
          rowGetter={({ index }) => this.state.rows[index]}
          columns={this.getColumns()}
          sortable={false}
        />
      </Paper>
    );
  }
}

export default withStyles(styles)(AttributeTable);
