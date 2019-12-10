import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { withStyles } from "@material-ui/core/styles";
import TableCell from "@material-ui/core/TableCell";
import { AutoSizer, Column, Table } from "react-virtualized";
import "react-virtualized/styles.css";

const styles = theme => ({
  flexContainer: {
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box"
  },
  table: {
    // temporary right-to-left patch, waiting for
    // https://github.com/bvaughn/react-virtualized/issues/454
    "& .ReactVirtualized__Table__headerRow": {
      flip: false,
      overflow: "auto",
      paddingRight: theme.direction === "rtl" ? "0px !important" : undefined
    }
  },
  tableRow: {
    cursor: "pointer",
    whiteSpace: "wrap",
    "&:hover": {
      backgroundColor: theme.palette.grey[200]
    }
  },
  tableRowHover: {
    "&:hover": {
      backgroundColor: theme.palette.grey[200]
    }
  },
  headerCells: {
    padding: 0,

    cursor: "pointer",
    textAlign: "center",
    fontSize: "0.8em",
    wordBreak: "break-all",
    flex: 1,
    lineHeight: 1
  },

  headerStyle: {},

  columnStyle: {
    whiteSpace: "pre-wrap",
    marginRight: 0,
    marginLeft: 0,
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box"
  },

  rowCell: {
    marginRight: 0
  },

  noClick: {
    cursor: "pointer"
  }
});

class VirtualizedTable extends React.PureComponent {
  static defaultProps = {
    headerHeight: 48,
    rowHeight: 48
  };

  rowClicked = ({ index }) => {
    console.log(index, "index");
  };

  getRowClassName = ({ index }) => {
    console.log(index, "index");
    const { classes } = this.props;

    return clsx(classes.tableRow, classes.flexContainer);
    /*, {
      [classes.tableRowHover]: index !== -1 && onRowClick != null
    });*/
  };

  cellRenderer = ({ cellData, columnIndex }) => {
    const { columns, classes, rowHeight, onRowClick } = this.props;
    return (
      <TableCell
        component="div"
        className={clsx(classes.rowCell, {
          [classes.noClick]: onRowClick == null
        })}
        variant="body"
        style={{
          height: rowHeight,
          marginLeft: 0,
          textAlign: "center",
          flex: 1
        }}
        align={
          (columnIndex != null && columns[columnIndex].numeric) || false
            ? "right"
            : "left"
        }
      >
        {cellData}
      </TableCell>
    );
  };

  headerRenderer = ({ label, columnIndex }) => {
    const { headerHeight, columns, classes } = this.props;

    return (
      <TableCell
        component="div"
        className={clsx(classes.flexContainer, classes.headerCells)}
        variant="head"
        style={{ height: headerHeight }}
        align={columns[columnIndex].numeric || false ? "right" : "left"}
      >
        {label}
      </TableCell>
    );
  };

  render() {
    const {
      classes,
      columns,
      rowHeight,
      headerHeight,
      windowWidth,
      ...tableProps
    } = this.props;
    return (
      <AutoSizer>
        {({ height, width }) => (
          <Table
            height={height}
            width={width}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            onRowClick={this.rowClicked}
            className={classes.table}
            rowClassName={this.getRowClassName}
            {...tableProps}
          >
            {columns.map(({ dataKey, ...other }, index) => {
              return (
                <Column
                  key={dataKey}
                  headerRenderer={headerProps =>
                    this.headerRenderer({
                      ...headerProps,
                      columnIndex: index
                    })
                  }
                  headerStyle={{
                    marginRight: 0,
                    marginLeft: 0,
                    textAlign: "center"
                  }}
                  className={clsx(classes.flexContainer, classes.columnStyle)}
                  cellRenderer={this.cellRenderer}
                  dataKey={dataKey}
                  {...other}
                />
              );
            })}
          </Table>
        )}
      </AutoSizer>
    );
  }
}

export default withStyles(styles)(VirtualizedTable);
