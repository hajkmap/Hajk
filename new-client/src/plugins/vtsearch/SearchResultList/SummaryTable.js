import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import VirtualizedTable from "./VirtualizedTable";

const styles = (theme) => ({
  paper: { height: 240, boxShadow: "none" },
});

/**
 * @summary Table used to show summary for journeys
 * @description Table used to show a summary when the user search
 * for the type Journeys
 * @class SummaryTable
 * @extends {React.Component}
 */
class SummaryTable extends React.Component {
  state = {
    rows: this.props.rows,
  };

  render = () => {
    const { classes, rowHeight, columns, height } = this.props;

    return (
      <Paper className={classes.paper} style={{ height: `${height}px` }}>
        <VirtualizedTable
          rowCount={this.state.rows.length}
          rowHeight={rowHeight}
          rowGetter={({ index }) => this.state.rows[index]}
          columns={columns}
          sortable={false}
        />
      </Paper>
    );
  };
}

export default withStyles(styles)(SummaryTable);
