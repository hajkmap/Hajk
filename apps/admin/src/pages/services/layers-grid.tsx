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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "../../components/progress/circular-progress";
import Scrollbar from "../../components/scrollbar/scrollbar";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { LayersGridProps, useLayersByServiceId } from "../../api/services";
import SearchIcon from "@mui/icons-material/Search";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
  const { data: layersByService } = useLayersByServiceId(serviceId);
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const navigate = useNavigate();
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const columns = [
    { field: "layer", headerName: t("common.layerName"), flex: 1 },
    { field: "infoClick", headerName: t("common.infoclick"), flex: 0.3 },
    { field: "publications", headerName: t("common.publications"), flex: 0.5 },
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
            <Typography sx={{ textAlign: "center", fontSize: "large" }}>
              Hajk-lager som använder denna tjänsten
            </Typography>

            {layersByService?.layers?.length === 0 && (
              <Typography
                sx={{ textAlign: "center", fontSize: "large", mt: 1 }}
              >
                Inga lager att visa
              </Typography>
            )}

            {layersByService?.layers && layersByService?.layers?.length > 0 && (
              <TableContainer>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: "medium" }}>Namn</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {layersByService?.layers.map((data) => (
                      <TableRow
                        key={data.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {data.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Button onClick={handleClickOpen} sx={{ float: "right", mt: 1 }}>
              Öppna
            </Button>
            <Dialog
              open={open}
              fullWidth
              onClose={handleClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              maxWidth="lg"
            >
              <DialogContent>
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

                <IconButton
                  edge="start"
                  color="inherit"
                  onClick={handleClose}
                  aria-label="close"
                  sx={{ float: "right" }}
                >
                  <CloseIcon />
                </IconButton>
                <Button
                  onClick={() =>
                    void handleCreateLayer({
                      serviceId,
                      selectedLayers: selectedRowObjects,
                    })
                  }
                  sx={{ display: "block" }}
                >
                  Skapa
                </Button>
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
                          language === "sv"
                            ? GRID_SWEDISH_LOCALE_TEXT
                            : undefined
                        }
                        checkboxSelection
                        disableRowSelectionOnClick
                      />
                    </Scrollbar>
                  </Box>
                )}
              </DialogContent>
            </Dialog>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
}

export default LayersGrid;
