import React from "react";

import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from "@mui/x-data-grid";

const DefaultTable = (props) => {
  const { feature } = props;

  // Grab the geometry name and all properties from feature
  const geometryName = feature.getGeometryName();
  const properties = feature.getProperties();

  // We don't want to show the geometry data in the table,
  // so we get rid of it:
  delete properties[geometryName];

  // Two columns, basic key-value table. However, it's called
  // "id", not "key", because the DataGrid component requires
  // all rows to have a unique "id" property.
  const columns = [
    { field: "id", headerName: "Nyckel", width: 150 },
    {
      field: "value",
      headerName: "Värde",
      flex: 1,
    },
  ];

  // Re-format the feature's properties array into the
  // format that DataGrid expects for rows:
  const rows = Object.entries(properties).map((a) => {
    return { id: a[0], value: a[1] };
  });

  return (
    <div style={{ height: 500, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={rows.length} // Ensure that the page fits all rows
        hideFooter={true} // No need to show the footer, we don't want to paginate here
        components={{
          Toolbar: CustomToolbar,
        }}
      />
    </div>
  );
};

/**
 * @summary Prepare a very basic DataGrid toolbar: we only want the Export functionality
 *
 * @return {React.Component} GridToolbarContainer
 */
const CustomToolbar = () => {
  return (
    <GridToolbarContainer>
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

export default DefaultTable;
