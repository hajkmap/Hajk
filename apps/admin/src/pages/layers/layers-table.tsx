import React from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from "@mui/x-data-grid";
import { useNavigate } from "react-router";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, Menu, MenuItem, Box } from "@mui/material";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import { Layer } from "../../api/layers";

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
    </GridToolbarContainer>
  );
}

function RowMenu({ id }: { id: string }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <Box>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreHorizIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => alert(`View ${id}`)}>View</MenuItem>
        <MenuItem onClick={() => alert(`Edit ${id}`)}>Edit</MenuItem>
        <MenuItem onClick={() => alert(`Delete ${id}`)}>Delete</MenuItem>
      </Menu>
    </Box>
  );
}

export default function LayersTable({
  layers,
  language,
}: {
  layers: Layer[];
  language: string;
}) {
  const navigate = useNavigate();

  return (
    <DataGrid
      rows={layers ?? []}
      columns={[
        { field: "serviceType", headerName: "Service Type", flex: 0.4 },
        { field: "name", headerName: "Name", flex: 1 },
        { field: "url", headerName: "URL", flex: 1 },
        {
          field: "actions",
          headerName: "Actions",
          flex: 0.5,
          renderCell: (params) => <RowMenu id={params.row?.id} />,
        },
      ]}
      sx={{ "& .MuiDataGrid-row:hover": { cursor: "pointer" } }}
      onCellClick={(params) => {
        if (params.field === "actions") {
          return;
        }
        const id: string = (params.row as Layer).id;
        if (id) {
          void navigate(`/layers/${id}`);
        }
      }}
      localeText={language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined}
      slots={{
        toolbar: CustomToolbar,
      }}
      pageSizeOptions={[10, 25, 50]}
    />
  );
}
