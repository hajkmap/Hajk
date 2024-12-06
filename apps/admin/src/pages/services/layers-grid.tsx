import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  Typography,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import CircularProgress from "../../components/progress/circular-progress";
import Scrollbar from "../../components/scrollbar";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import {
  useServiceCapabilities,
  UseServiceCapabilitiesProps,
} from "../../api/services";
import SearchIcon from "@mui/icons-material/Search";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

function LayersGrid({ baseUrl: url, type }: UseServiceCapabilitiesProps) {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const language = useAppStateStore((state) => state.language);

  const {
    layers: getCapLayers,
    isError: layersError,
    isLoading: layersLoading,
  } = useServiceCapabilities({
    baseUrl: url,
    type: type,
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const columns = [
    { field: "layer", headerName: t("common.layerName"), flex: 1 },
    { field: "infoClick", headerName: t("common.infoclick"), flex: 0.3 },
    { field: "publications", headerName: t("common.publications"), flex: 1 },
    {
      field: "actions",
      headerName: t("common.actions"),
      flex: 0.2,
      renderCell: (params: { row: { layer: string } }) => (
        <RowMenu {...params} />
      ),
    },
  ];

  const filteredLayers = useMemo(() => {
    if (!getCapLayers) return [];
    return getCapLayers
      .filter((layer) => layer.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((layer, index) => ({
        id: index,
        layer,
        infoClick: "",
        publications: "",
        actions: "",
      }));
  }, [getCapLayers, searchTerm]);

  const RowMenu = (params: { row: { layer: string } }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget as HTMLElement | null);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    return (
      <>
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
          <MenuItem onClick={() => alert(`View ${params.row.layer}`)}>
            View
          </MenuItem>
          <MenuItem onClick={() => alert(`Edit ${params.row.layer}`)}>
            Edit
          </MenuItem>
          <MenuItem onClick={() => alert(`Delete ${params.row.layer}`)}>
            Delete
          </MenuItem>
        </Menu>
      </>
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
            <Typography variant="h6">
              {t("services.settings.accordionTitle2")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            {layersLoading ? (
              <CircularProgress
                color="primary"
                size={40}
                typographyText={t("circularProgress.loadingLayers")}
              />
            ) : layersError ? (
              <Typography align="center" color={palette.error.main}>
                {t("services.error.url")}
              </Typography>
            ) : filteredLayers.length === 0 ? (
              <Typography align="center" color={palette.error.main}>
                {t("services.error.layers")}
              </Typography>
            ) : (
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
                  label={t("common.searchLayer")}
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
                    rows={filteredLayers}
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
                    hideFooterPagination={
                      getCapLayers && getCapLayers.length < 10
                    }
                    pageSizeOptions={[10, 25, 50, 100]}
                    pagination
                    loading={layersLoading}
                    localeText={
                      language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
                    }
                    checkboxSelection
                    disableMultipleRowSelection
                    disableRowSelectionOnClick
                  />
                </Scrollbar>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
}

export default LayersGrid;
