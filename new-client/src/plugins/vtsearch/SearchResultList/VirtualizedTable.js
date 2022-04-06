import React from "react";
import clsx from "clsx";
import { withStyles } from "@material-ui/core/styles";
import TableCell from "@material-ui/core/TableCell";
import { AutoSizer, Column, Table } from "react-virtualized";
import { SortIndicator } from "react-virtualized";

import "react-virtualized/styles.css";
import { Typography, Tooltip } from "@material-ui/core";

const styles = (theme) => ({
  flexContainer: {
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
  },

  table: {
    // temporary right-to-left patch, waiting for
    // https://github.com/bvaughn/react-virtualized/issues/454
    "& .ReactVirtualized__Table__headerRow": {
      flip: false,
      overflow: "auto",
      borderBottom: `1px solid ${theme.palette.common.black}`,
      textTransform: "none",
      padding: theme.spacing(0),
      paddingRight: theme.direction === "rtl" ? "0px !important" : undefined,
    },
  },

  tableRowHover: {
    "&:hover": {
      backgroundColor: theme.palette.grey[200],
    },
  },

  tableRow: {
    cursor: "pointer",
    border: `1px solid ${theme.palette.grey[200]}`,
    whiteSpace: "wrap",
    outline: "none",
  },
  tableRowSelected: {
    background: theme.palette.primary.main,
  },
  headerColumn: {
    whiteSpace: "pre-wrap",
    alignItems: "center",
    boxSizing: "border-box",
    justifyContent: "flex-start",
    cursor: "pointer",
    display: "flex",
    paddingTop: theme.spacing(0),
    paddingRight: theme.spacing(0),
    paddingBottom: theme.spacing(0),
    minWidth: theme.spacing(0),
    lineHeight: 1,
    borderBottom: theme.spacing(0),
  },
  columnStyle: {
    whiteSpace: "pre-wrap",
    alignItems: "center",
    boxSizing: "border-box",
    justifyContent: "center",
    cursor: "pointer",
    wordBreak: "break-all",
    borderBottom: theme.spacing(0),
  },
  rowCell: {
    marginRight: 0,
    border: "none",
    borderBottom: 0,
    textAlign: "center",
    flex: 1,
  },
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
    headerHeight: 40,
    rowHeight: 30,
    sortable: true,
    selectedRow: headerRowIndex,
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

  getCellClassName = () => {
    const { classes } = this.props;
    return classes.rowCell;
  };

  cellRenderer = ({ cellData, columnIndex, rowData }) => {
    const { columns } = this.props;
    if (cellData == null) {
      return "";
    }

    return (
      <>
        <Tooltip title={cellData}>
          <TableCell
            component="div"
            className={this.getCellClassName()}
            variant="body"
            align={
              (columnIndex != null && columns[columnIndex].numeric) || false
                ? "right"
                : "left"
            }
          >
            {cellData}
          </TableCell>
        </Tooltip>
      </>
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
        <Typography variant="caption">{label}</Typography>

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
                    headerRenderer={(headerProps) =>
                      this.headerRenderer({
                        ...headerProps,
                        columnIndex: index,
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
