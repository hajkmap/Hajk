import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";

/**
 * @summary Table used to show summary for journeys
 * @description Table used to show a summary when the user search
 * for the type Journeys
 * @class SummaryTable
 * @extends {React.Component}
 */
class SummaryTable extends React.Component {
  state = {
    rows: this.getRows()
  };
  //MOCK
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

  //MOCK
  getRows() {
    return [
      { id: 0, operator: "SJ Götalandståg", lines: "TÅG" },
      { id: 0, operator: "SJ Götalandståg", lines: "TÅG" },
      { id: 0, operator: "SJ Götalandståg", lines: "TÅG" },
      { id: 0, operator: "SJ Götalandståg", lines: "TÅG" },
      { id: 0, operator: "SJ Götalandståg", lines: "TÅG" },
      { id: 0, operator: "SJ Götalandståg", lines: "TÅG" },
      { id: 0, operator: "SJ Götalandståg", lines: "TÅG" }
    ];
  }

  render() {
    const { windowWidth } = this.props;

    return (
      <Paper style={{ height: 240, width: windowWidth }}>
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

export default SummaryTable;
