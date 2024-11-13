import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Typography,
  Box,
  TablePagination,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface ServicesTableProps {
  layers: string[];
  layersLoading: boolean;
  layersError: boolean;
}

function ServicesTable({
  layers,
  layersLoading,
  layersError,
}: ServicesTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

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
    <SimpleBar style={{ maxHeight: "500px" }}>
      <Box sx={{ overflowY: "auto" }}>
        <TextField
          sx={{ mb: 2, mt: 1, width: "50%" }}
          label="Search Layer(s)"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          slotProps={{
            input: { endAdornment: <SearchIcon /> },
          }}
        />
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Lagernamn</TableCell>
                <TableCell align="right">Infoklick</TableCell>
                <TableCell align="right">Publiceringar</TableCell>
                <TableCell align="right">Åtgärder</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {layersError ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    style={{ color: "red" }}
                  >
                    Error loading layers. The provided url is not valid.
                  </TableCell>
                </TableRow>
              ) : paginatedLayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No layers available.
                  </TableCell>
                </TableRow>
              ) : layersLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={24} />
                    <Typography variant="body2">Loading layers...</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLayers.map((layer, index) => (
                  <TableRow key={index}>
                    <TableCell>{layer || "Unnamed Layer"}</TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
          component="div"
          count={filteredLayers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </SimpleBar>
  );
}

export default ServicesTable;
