import React from "react";
import clsx from "clsx";
import { withStyles } from "@material-ui/core/styles";
import TableCell from "@material-ui/core/TableCell";
import { AutoSizer, Column, Table } from "react-virtualized";
import { SortIndicator } from "react-virtualized";

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
      borderBottom: "solid",

      textTransform: "none",
      padding: 0,
      paddingRight: theme.direction === "rtl" ? "0px !important" : undefined
    }
  },
  tableRowHover: {
    "&:hover": {
      backgroundColor: theme.palette.grey[200]
    }
  },

  tableRow: {
    cursor: "pointer",
    border: "1px solid #c3c7c7",
    whiteSpace: "wrap",
    outline: "none"
  },
  tableRowSelected: {
    border: "2px solid rgba(18,120,211,0.37)",
    background: "rgba(0,212,255,1)"
  },
  headerColumn: {
    whiteSpace: "pre-wrap",
    alignItems: "center",
    boxSizing: "border-box",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    minWidth: 0,
    wordBreak: "break-all",
    lineHeight: 1,
    borderBottom: 0
  },
  columnStyle: {
    whiteSpace: "pre-wrap",
    alignItems: "center",
    boxSizing: "border-box",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "0.8em",
    paddingLeft: 0,
    minWidth: 0,
    wordBreak: "break-all",
    lineHeight: 1,
    borderBottom: 0
  },
  rowCell: {
    marginRight: 0,
    borderBottom: 0,
    textAlign: "center",
    padding: 0,
    flex: 1
  }
});

const headerRowIndex = -1;

/**
 * @summary VirtualizedTable is the core class to handle the table used in Attribute Table
 * @description VirtualizedTable uses React Virtualized to render large lists in a smart way to boost performance.
 * @class VirtualizedTable
 * @extends {React.PureComponent}
 */

class VirtualizedTable extends React.PureComponent {
  static defaultProps = {
    headerHeight: 35,
    rowHeight: 30,
    sortable: true,
    selectedRow: headerRowIndex
  };

  getRowClassName = ({ index }) => {
    const { classes } = this.props;
    if (index !== headerRowIndex && this.props.selectedRow.index === index) {
      return clsx(
        classes.tableRow,
        classes.tableRowSelected,
        classes.flexContainer
      );
    }
    return (
      index !== headerRowIndex &&
      clsx(classes.tableRow, classes.tableRowHover, classes.flexContainer)
    );
  };

  cellRenderer = ({ cellData, columnIndex, rowData }) => {
    const { columns, classes, rowHeight } = this.props;

    return (
      <TableCell
        component="div"
        className={classes.rowCell}
        variant="body"
        style={{
          height: rowHeight
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

  headerRenderer = ({ label, columnIndex, sortDirection }) => {
    const { columns, classes, sortable } = this.props;

    return (
      <TableCell
        component="div"
        className={classes.headerColumn}
        variant="head"
        align={columns[columnIndex].numeric || false ? "right" : "left"}
      >
        {label}
        {sortable && <SortIndicator sortDirection={sortDirection} />}
      </TableCell>
    );
  };

  render() {
    const {
      classes,
      columns,
      rowHeight,
      rowClicked,
      headerHeight,
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
            onRowClick={rowClicked}
            className={classes.table}
            rowClassName={this.getRowClassName}
            {...tableProps}
          >
            {columns.map(({ dataKey, ...other }, index) => {
              return (
                dataKey !== "id" && (
                  <Column
                    key={dataKey}
                    headerRenderer={headerProps =>
                      this.headerRenderer({
                        ...headerProps,
                        columnIndex: index
                      })
                    }
                    className={classes.columnStyle}
                    cellRenderer={this.cellRenderer}
                    dataKey={dataKey}
                    {...other}
                  />
                )
              );
            })}
          </Table>
        )}
      </AutoSizer>
    );
  }
}

export default withStyles(styles)(VirtualizedTable);
