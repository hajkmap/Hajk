import React, { useState, useRef } from "react";
import { useSnackbar } from "notistack";

import {
  Box,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

function FavoritesViewHeader({
  backButtonCallback,
  importFavoritesCallback,
  functionalCookiesOk,
  favoritesInfoText,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  // State that toggles info collapse
  const [infoIsActive, setInfoIsActive] = useState(false);
  // Because of a warning in dev console, we need special handling of tooltip for backbutton.
  // When a user clicks back, the tooltip of the button needs to be closed before this view hides.
  // TODO: Needs a better way to handle this
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Handles click on back button in header
  const handleBackButtonClick = (e) => {
    e.stopPropagation();
    setTooltipOpen(false);
    setTimeout(() => {
      backButtonCallback();
    }, 100);
  };

  // Handles click on info button in header
  const handleInfoButtonClick = (e) => {
    e.stopPropagation();
    setInfoIsActive(!infoIsActive);
  };

  // Handles click on upload button in header
  const handleImportButtonClick = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handles backbutton tooltip open event
  const handleOpen = () => {
    setTooltipOpen(true);
  };

  // Handles backbutton tooltip close event
  const handleClose = () => {
    setTooltipOpen(false);
  };

  // Handles file input changes
  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (event) => {
        const contents = event.target?.result;
        try {
          // Parse the string to a real object
          const parsedFavorites = JSON.parse(contents);

          if (parsedFavorites.layers?.length > 0) {
            // Add it to collection
            importFavoritesCallback(parsedFavorites);
          }
        } catch (error) {
          console.error(`Favorite could not be parsed. Error: ${error}`);
          enqueueSnackbar(
            "Favoriten kunde inte laddas, kontrollera att .json filen ser korrekt ut.",
            {
              variant: "error",
              anchorOrigin: { vertical: "bottom", horizontal: "center" },
            }
          );
        }
      };
    }
  };

  return (
    <Box
      sx={{
        p: 1,
        backgroundColor: (theme) => theme.palette.grey[100],
        borderBottom: (theme) =>
          `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Stack direction="row" alignItems="center">
        <Tooltip
          open={tooltipOpen}
          onClose={handleClose}
          onOpen={handleOpen}
          title="Tillbaka"
          TransitionProps={{ timeout: 0 }}
        >
          <IconButton onClick={handleBackButtonClick}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1, textAlign: "center" }}>
          <Typography variant="subtitle1">Mina favoriter</Typography>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />
        <IconButton
          disabled={!functionalCookiesOk}
          onClick={handleImportButtonClick}
        >
          <Tooltip title={"Importera"}>
            <FileUploadOutlinedIcon />
          </Tooltip>
        </IconButton>
        <IconButton onClick={handleInfoButtonClick}>
          <Tooltip title={infoIsActive ? "Dölj info" : "Visa info"}>
            <InfoOutlinedIcon />
          </Tooltip>
        </IconButton>
      </Stack>
      <Collapse
        in={infoIsActive}
        timeout="auto"
        unmountOnExit
        className="infoCollapse"
      >
        <Box
          sx={{
            px: 1,
            pt: 1,
            borderTop: (theme) =>
              `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2">{favoritesInfoText}</Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

export default FavoritesViewHeader;
