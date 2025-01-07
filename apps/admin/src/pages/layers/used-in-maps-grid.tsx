import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import Scrollbar from "../../components/scrollbar/scrollbar";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

function UsedInMapsGrid() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const language = useAppStateStore((state) => state.language);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const columns = [
    { field: "title", headerName: "Titel", flex: 1 },
    { field: "description", headerName: "Beskrivning", flex: 1 },
    {
      field: "actions",
      headerName: "Åtgärder",
      flex: 0.2,
      renderCell: (params: { row: { title: string } }) => (
        <RowMenu {...params} />
      ),
    },
  ];

  const rows = [
    {
      id: 1,
      title: "Strandskyddskartan",
      description: "Karta över bygglov före hela kommunen",
    },
    {
      id: 2,
      title: "Bygglovskartan",
      description: "Karta över bygglov för hela kommunen",
    },
  ];

  const RowMenu = (params: { row: { title: string } }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget as HTMLElement | null);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    return (
      <Box component="div" sx={{ textAlign: "center" }}>
        <IconButton onClick={handleClick}>
          <MoreHorizIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <MenuItem onClick={() => alert(`View ${params.row.title}`)}>
            View
          </MenuItem>
          <MenuItem onClick={() => alert(`Edit ${params.row.title}`)}>
            Edit
          </MenuItem>
          <MenuItem onClick={() => alert(`Delete ${params.row.title}`)}>
            Delete
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  return (
    <Grid container>
      <Grid size={{ xs: 12, md: 12 }}>
        <Accordion
          disableGutters
          sx={{
            width: "100%",
            mb: 3,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{t("common.usedInMaps")}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TextField
                sx={{
                  mb: 4,
                  mt: 1,
                  width: "100%",
                  maxWidth: "400px",
                }}
                label="Sök i kartor"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                slotProps={{
                  input: {
                    endAdornment: <SearchIcon />,
                  },
                }}
              />
              <Scrollbar sx={{ maxHeight: "400px" }}>
                <DataGrid
                  sx={{ maxWidth: "100%", mb: 2, mt: 1 }}
                  rows={rows}
                  columns={columns}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 10,
                      },
                    },
                  }}
                  slotProps={{
                    loadingOverlay: {
                      variant: "skeleton",
                      noRowsVariant: "skeleton",
                    },
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                  pagination
                  localeText={
                    language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
                  }
                  checkboxSelection
                  disableMultipleRowSelection
                  disableRowSelectionOnClick
                />
              </Scrollbar>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
}

export default UsedInMapsGrid;
