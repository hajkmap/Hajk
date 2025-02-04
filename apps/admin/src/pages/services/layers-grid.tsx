import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
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
import Scrollbar from "../../components/scrollbar/scrollbar";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { LayersGridProps } from "../../api/services";
import SearchIcon from "@mui/icons-material/Search";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useCreateLayer, LayerCreateInput } from "../../api/layers";

function LayersGrid({
  layers,
  serviceId,
  isError,
  isLoading,
}: LayersGridProps) {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const language = useAppStateStore((state) => state.language);
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";
  const { mutateAsync: createLayer } = useCreateLayer();
  const [selectedRowObjects, setSelectedRowObjects] = useState<string[]>();

  const navigate = useNavigate();
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const columns = [
    { field: "layer", headerName: t("common.layerName"), flex: 1 },
    { field: "infoClick", headerName: t("common.infoclick"), flex: 0.3 },
    { field: "publications", headerName: t("common.publications"), flex: 0.5 },
    {
      field: "actions",
      headerName: t("common.actions"),
      flex: 0.3,
      renderCell: (params: { row: { layer: string } }) => (
        <RowMenu {...params} />
      ),
    },
  ];

  const filteredLayers = useMemo(() => {
    if (!layers) return [];
    return layers
      .filter((layer) => layer.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((layer, index) => ({
        id: index,
        layer,
        infoClick: "",
        publications: "",
        actions: "",
      }));
  }, [layers, searchTerm]);

  const handleCreateLayer = async (layer: LayerCreateInput) => {
    try {
      const payload = {
        serviceId,
        selectedLayers: layer.selectedLayers ?? [],
      };

      const response = await createLayer(payload);
      void navigate("/layers/" + response?.id);
    } catch (error) {
      console.error("Failed to create layer:", error);
    }
  };

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
          <MenuItem
            onClick={() =>
              void handleCreateLayer({
                serviceId,
                selectedLayers: selectedRowObjects ?? [params.row.layer],
              })
            }
          >
            {t("common.create")}
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
            backgroundColor: isDarkMode ? "#121212" : "#efefef",
            border: 0,
            boxShadow: "none",
            borderRadius: "8px",
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {t("services.settings.accordionTitle2")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            <TextField
              sx={{
                mb: 2,
                mt: 1,
                width: "100%",
                maxWidth: "400px",
                backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
              }}
              label={t("layers.searchTitle")}
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  endAdornment: <SearchIcon />,
                },
              }}
            />
            {isLoading ? (
              <CircularProgress
                color="primary"
                size={40}
                typographyText={t("services.loadingLayers")}
              />
            ) : isError ? (
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
                <Scrollbar sx={{ maxHeight: "400px" }}>
                  <DataGrid
                    onRowSelectionModelChange={(ids) => {
                      const selectedRowsData = ids.map((id) =>
                        filteredLayers.find((row) => row.id === id)
                      );
                      setSelectedRowObjects(
                        selectedRowsData.map((row) => row?.layer ?? "")
                      );
                    }}
                    sx={{
                      maxWidth: "100%",
                      mb: 2,
                      mt: 1,
                      backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
                    }}
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
                    hideFooterPagination={layers && layers.length < 10}
                    pageSizeOptions={[10, 25, 50, 100]}
                    pagination
                    loading={isLoading}
                    localeText={
                      language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
                    }
                    checkboxSelection
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
