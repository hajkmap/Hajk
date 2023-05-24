import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSnackbar } from "notistack";

import {
  Button,
  Box,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  InputAdornment,
  FormControlLabel,
  FormGroup,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
  Collapse,
  TextField,
  Typography,
  Stack,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";

function LayerPackage({
  display,
  backButtonCallback,
  quickLayerPresets,
  map,
  globalObserver,
}) {
  const { enqueueSnackbar } = useSnackbar();
  // State that toggles info collapse
  const [infoIsActive, setInfoIsActive] = useState(false);
  // Confirmation dialogs
  const [loadLpConfirmation, setLoadLpConfirmation] = useState(null);
  const [loadLpInfoConfirmation, setLoadLpInfoConfirmation] = useState(null);
  const [missingLayersConfirmation, setMissingLayersConfirmation] =
    useState(null);
  const [clearExistingQuickAccessLayers, setClearExistingQuickAccessLayers] =
    useState(true);

  // Because of a warning in dev console, we need special handling of tooltip for backbutton.
  // When a user clicks back, the tooltip of the button needs to be closed before this view hides.
  // TODO: Needs a better way to handle this
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Filter state
  const [filter, setFilter] = useState({
    query: "",
    list: quickLayerPresets || [],
  });

  // Handles click on back button in header
  const handleBackButtonClick = (setQuickAccessSectionExpanded) => {
    setTooltipOpen(false);
    setTimeout(() => {
      setQuickAccessSectionExpanded
        ? backButtonCallback({ setQuickAccessSectionExpanded: true })
        : backButtonCallback();
    }, 100);
  };

  // Handles click on info button in header
  const handleInfoButtonClick = () => {
    setInfoIsActive(!infoIsActive);
  };

  // Handles click on info button in header
  const handleLpInfoClick = (qlp) => {
    setLoadLpInfoConfirmation(qlp);
  };

  // Handles filter functionality
  const handleFilterChange = (value) => {
    const results = quickLayerPresets.filter((data) => {
      if (value === "") return data;
      return (
        data.title.toLowerCase().includes(value.toLowerCase()) ||
        data.author.toLowerCase().includes(value.toLowerCase()) ||
        data.keywords.some((keyword) =>
          keyword.toLowerCase().includes(value.toLowerCase())
        )
      );
    });
    setFilter({
      query: value,
      list: results,
    });
  };

  // Handles LayerPackage item click
  const handleLpClick = (qlp) => {
    setLoadLpConfirmation(qlp);
  };

  // Fires when the user confirms the confirmation-window.
  const handleLoadConfirmation = (infoType) => {
    let lpInfo = infoType
      ? { ...loadLpInfoConfirmation }
      : { ...loadLpConfirmation };

    setLoadLpConfirmation(null);
    setLoadLpInfoConfirmation(null);

    // Check if layers from layerpackage exists in map
    const missingLayers = checkForMissingLayers(lpInfo.layers);
    if (missingLayers.length > 0) {
      // Show missing layers dialog
      setMissingLayersConfirmation({
        missingLayers: missingLayers,
        layers: lpInfo.layers,
        title: lpInfo.title,
      });
    } else {
      loadLayers(lpInfo.layers, lpInfo.title);
    }
  };

  // Load layers to quickAccess section
  const loadLayers = (layers, title) => {
    if (clearExistingQuickAccessLayers) {
      clearQuickAccessLayers();
    }

    setMissingLayersConfirmation(null);

    map.getAllLayers().forEach((layer) => {
      const info = layers.find((l) => l.id === layer.get("name"));
      if (info) {
        // Set quickaccess property
        layer.set("quickAccess", true);
        // Special handling for layerGroups
        if (layer.get("layerType") === "group") {
          if (info.visible === true) {
            const subLayersToShow = info.subLayers
              ? info.subLayers.split(",")
              : [];
            globalObserver.publish("layerswitcher.showLayer", {
              layer,
              subLayersToShow,
            });
          } else {
            globalObserver.publish("layerswitcher.hideLayer", layer);
          }
        } else {
          layer.set("visible", info.visible);
        }
        layer.set("opacity", info.opacity);
        layer.setZIndex(info.drawOrder);
      }
    });

    enqueueSnackbar(`${title} har nu laddats till snabblager.`, {
      variant: "success",
    });

    // Close layerPackage view on load
    handleBackButtonClick(true);
  };

  // Check if all layers in package exist in map
  const checkForMissingLayers = (layers) => {
    map.getAllLayers().forEach((layer) => {
      const existingLayer = layers.find((l) => l.id === layer.get("name"));
      if (existingLayer) {
        // Remove the layer from the layers array once it's found
        layers = layers.filter((l) => l.id !== existingLayer.id);
      }
    });
    // At this point, the layers array will only contain the layers that don't exist in map.getAllLayers()
    return layers;
  };

  // Clear quickaccessLayers
  const clearQuickAccessLayers = () => {
    map
      .getAllLayers()
      .filter((l) => l.get("quickAccess") === true)
      .map((l) => l.set("quickAccess", false));
  };

  // Fires when the user closes the confirmation-window.
  const handleLoadConfirmationAbort = () => {
    setLoadLpConfirmation(null);
    setLoadLpInfoConfirmation(null);
  };

  // Fires when the user closes the missing layers-window.
  const handleMissingLayersConfirmationAbort = () => {
    setMissingLayersConfirmation(null);
  };

  // Handles backbutton tooltip close event
  const handleClose = () => {
    setTooltipOpen(false);
  };

  // Handles backbutton tooltip open event
  const handleOpen = () => {
    setTooltipOpen(true);
  };

  // Render dialog with layerpackage information
  const renderInfoDialog = () => {
    return createPortal(
      <Dialog
        open={loadLpInfoConfirmation ? true : false}
        onClose={handleLoadConfirmationAbort}
      >
        <DialogTitle sx={{ pb: 0 }}>
          {loadLpInfoConfirmation ? loadLpInfoConfirmation.title : ""}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ pb: 2 }}>
            {loadLpInfoConfirmation ? loadLpInfoConfirmation.author : ""}
          </DialogContentText>
          <Typography>
            {loadLpInfoConfirmation ? loadLpInfoConfirmation.description : ""}
          </Typography>
          <Typography>
            {loadLpInfoConfirmation
              ? `Nyckelord: ${loadLpInfoConfirmation.keywords.join(", ")}`
              : ""}
          </Typography>
          <hr></hr>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={clearExistingQuickAccessLayers}
                  onChange={() =>
                    setClearExistingQuickAccessLayers(
                      !clearExistingQuickAccessLayers
                    )
                  }
                />
              }
              label="Ersätt allt i snabblager vid laddning"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoadConfirmationAbort}>Avbryt</Button>
          <Button
            onClick={() => handleLoadConfirmation(true)}
            variant="contained"
          >
            Ladda
          </Button>
        </DialogActions>
      </Dialog>,
      document.getElementById("windows-container")
    );
  };

  // Render dialog to load layerpackage
  const renderLoadDialog = () => {
    return createPortal(
      <Dialog
        open={loadLpConfirmation ? true : false}
        onClose={handleLoadConfirmationAbort}
      >
        <DialogTitle>Ladda lagerpaket</DialogTitle>
        <DialogContent>
          <Typography>
            {loadLpConfirmation
              ? `Lagerpaketet ${loadLpConfirmation.title} kommer nu att laddas till snabblager.`
              : ""}
            <br></br>
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={clearExistingQuickAccessLayers}
                  onChange={() =>
                    setClearExistingQuickAccessLayers(
                      !clearExistingQuickAccessLayers
                    )
                  }
                />
              }
              label="Ersätt allt i snabblager vid laddning"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoadConfirmationAbort}>Avbryt</Button>
          <Button
            onClick={() => handleLoadConfirmation(false)}
            variant="contained"
          >
            Ladda
          </Button>
        </DialogActions>
      </Dialog>,
      document.getElementById("windows-container")
    );
  };

  // Render dialog with missing layers information
  const renderMissingLayersDialog = () => {
    return createPortal(
      <Dialog
        open={missingLayersConfirmation ? true : false}
        onClose={handleMissingLayersConfirmationAbort}
      >
        <DialogTitle>Lager saknas</DialogTitle>
        <DialogContent>
          <Typography>
            {missingLayersConfirmation &&
              `Följande lagerid:n kan inte hittas i kartans lagerlista:`}
            <br></br>
          </Typography>
          <ul>
            {missingLayersConfirmation?.missingLayers.map((l) => {
              return <li key={l.id}>{l.id}</li>;
            })}
          </ul>
          <Typography>
            {missingLayersConfirmation &&
              `Det kan bero på att lagret har utgått. Vänligen kontrollera och uppdatera lagerpaketet eller kontakta administratören av kartan.`}
            <br></br>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMissingLayersConfirmationAbort}>Avbryt</Button>
          <Button
            onClick={() =>
              loadLayers(
                missingLayersConfirmation.layers,
                missingLayersConfirmation.title
              )
            }
            variant="contained"
          >
            Fortsätt
          </Button>
        </DialogActions>
      </Dialog>,
      document.getElementById("windows-container")
    );
  };

  return (
    <>
      <Box sx={{ display: display ? "block" : "none" }}>
        <Box
          sx={{
            p: 1,
            backgroundColor: (theme) => theme.palette.grey[100],
            borderBottom: (theme) =>
              `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
          }}
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
              <Typography variant="subtitle1">Ladda lager</Typography>
            </Box>
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
              <Typography variant="subtitle2">
                Här kan du ladda fördefinierade lagerpaket till snabblager.
                Paketen innehåller lager med synlighet, ritordning och
                inställningar.
              </Typography>
            </Box>
          </Collapse>
          <Box
            sx={{
              width: 500,
              maxWidth: "100%",
              p: 1,
            }}
          >
            <TextField
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
              value={filter.query}
              onChange={(event) => handleFilterChange(event.target.value)}
              fullWidth
              placeholder="Filtrera"
              variant="outlined"
              sx={{ background: "#fff" }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            pt: 1,
            px: 2,
          }}
        >
          <List dense>
            {!filter.list.length
              ? "Din filtrering gav inga resultat"
              : filter.list.map((l) => {
                  return (
                    <ListItemButton
                      dense
                      key={l.id}
                      sx={{
                        border: (theme) =>
                          `${theme.spacing(0.2)} solid ${
                            theme.palette.divider
                          }`,
                        borderRadius: "8px",
                        mb: 1,
                      }}
                      onClick={() => handleLpClick(l)}
                    >
                      <ListItemIcon sx={{ px: 0, minWidth: "34px" }}>
                        <LayersOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={l.title} secondary={l.author} />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLpInfoClick(l);
                          }}
                        >
                          <Tooltip title={"Information om " + l.title}>
                            <InfoOutlinedIcon fontSize="small" />
                          </Tooltip>
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  );
                })}
          </List>
        </Box>
      </Box>
      {renderLoadDialog()}
      {renderInfoDialog()}
      {renderMissingLayersDialog()}
    </>
  );
}

export default LayerPackage;
