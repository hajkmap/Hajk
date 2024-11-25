import React, { useState, useMemo } from "react";
import { Box, TextField, Typography, useTheme } from "@mui/material";
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

function ServicesGrid({ baseUrl: url, type }: UseServiceCapabilitiesProps) {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const language = useAppStateStore((state) => state.language);

  const {
    layers,
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
    { field: "infoClick", headerName: t("common.infoclick"), flex: 1 },
    { field: "publications", headerName: t("common.publications"), flex: 1 },
    { field: "actions", headerName: t("common.actions"), flex: 1 },
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

  return (
    <>
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
      ) : (
        <Box
          sx={{
            display: "flex",
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
              pageSizeOptions={[10, 25, 50, 100]}
              pagination
              loading={layersLoading}
              localeText={
                language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
              }
              disableRowSelectionOnClick
            />
          </Scrollbar>
        </Box>
      )}
    </>
  );
}

export default ServicesGrid;
