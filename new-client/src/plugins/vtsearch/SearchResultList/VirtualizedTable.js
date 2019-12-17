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
      paddingRight: theme.direction === "rtl" ? "0px !important" : undefined
    }
  },
  tableRow: {
    cursor: "pointer",
    border: "1px solid #c3c7c7",
    whiteSpace: "wrap",
    outline: "none",
    "&:hover": {
      backgroundColor: theme.palette.grey[200]
    }
  },
  tableRowSelected: {
    border: "2px solid rgba(18,120,211,0.37)",
    background: "rgba(0,212,255,1)"
  },
  columnStyle: {
    whiteSpace: "pre-wrap",
    alignItems: "center",
    boxSizing: "border-box",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "0.8em",
    paddingLeft: 0,
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

class VirtualizedTable extends React.PureComponent {
  static defaultProps = {
    headerHeight: 48,
    rowHeight: 48
  };

  getRowClassName = ({ index }) => {
    const { classes } = this.props;

    if (this.props.selectedRow.index === index) {
      return clsx(
        classes.tableRow,
        classes.tableRowSelected,
        classes.flexContainer
      );
    }
    return index !== -1 && clsx(classes.tableRow, classes.flexContainer);
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
    const { headerHeight, columns, classes } = this.props;

    return (
      <TableCell
        component="div"
        className={classes.columnStyle}
        variant="head"
        style={{
          height: headerHeight
        }}
        align={columns[columnIndex].numeric || false ? "right" : "left"}
      >
        {label}
        <SortIndicator sortDirection={sortDirection} />
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
                    headerStyle={{
                      marginLeft: 0
                    }}
                    className={classes.columnStyle}
                    style={{ marginRight: 0, marginLeft: 0 }} //Not working with className
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
