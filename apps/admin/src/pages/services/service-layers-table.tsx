import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  TablePagination,
  TextField,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useServiceCapabilities } from "../../api/services/";
import { UseServiceCapabilitiesProps } from "../../api/services/types";
import SearchIcon from "@mui/icons-material/Search";
import Scrollbar from "../../layouts/root/components/scrollbar";
import CircularProgress from "../../layouts/root/components/progress/circular-progress";

function ServicesTable({ baseUrl: url, type }: UseServiceCapabilitiesProps) {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    layers,
    isError: layersError,
    isLoading: layersLoading,
  } = useServiceCapabilities({
    baseUrl: url,
    type: type,
  });

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const filteredLayers = layers.filter((layer) =>
    layer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLayers =
    rowsPerPage > 0
      ? filteredLayers.slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage
        )
      : filteredLayers;

  return (
    <Box>
      <TextField
        sx={{
          mb: 2,
          mt: 1,
          width: "100%",
          maxWidth: "400px",
        }}
        label={t("common.searchLayer")}
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
        slotProps={{
          input: { endAdornment: <SearchIcon /> },
        }}
      />
      <Scrollbar sx={{ maxHeight: "400px" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  "& > *": {
                    fontWeight: "bold !important",
                    fontSize: "1rem !important",
                  },
                }}
              >
                <TableCell>{t("common.layerName")}</TableCell>
                <TableCell align="right">{t("common.infoclick")}</TableCell>
                <TableCell align="right">{t("common.publications")}</TableCell>
                <TableCell align="right">{t("common.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {layersError ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    style={{ color: palette.error.main }}
                  >
                    {t("services.error.url")}
                  </TableCell>
                </TableRow>
              ) : layersLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress
                      color="secondary"
                      size={30}
                      typographyText={t("circularProgress.loadingLayers")}
                    />
                  </TableCell>
                </TableRow>
              ) : layers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {t("services.error.layers")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLayers.map((layer, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {layer || t("services.error.unnamed.layer")}
                    </TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>
      <TablePagination
        rowsPerPageOptions={[
          10,
          25,
          50,
          100,
          { label: t("common.all"), value: -1 },
        ]}
        labelRowsPerPage={t("common.rowsPerPage")}
        labelDisplayedRows={({ from, to, count }) => {
          return (
            <>
              {from} - {to} {t("common.of")} {count !== -1 ? count : to}
            </>
          );
        }}
        component="div"
        count={filteredLayers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}

export default ServicesTable;
