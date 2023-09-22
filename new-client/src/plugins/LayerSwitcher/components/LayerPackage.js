import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSnackbar } from "notistack";

import {
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  InputAdornment,
  InputLabel,
  FormControl,
  FormGroup,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Tooltip,
  Collapse,
  TextField,
  Typography,
  Select,
  Stack,
} from "@mui/material";

import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
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
  const [replaceExistingBackgroundLayer, setReplaceExistingBackgroundLayer] =
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

    const allMapLayers = map.getAllLayers();
    layers.forEach((l) => {
      const layer = allMapLayers.find((la) => la.get("name") === l.id);
      if (layer) {
        // Set quickaccess property
        if (layer.get("layerType") !== "base") {
          layer.set("quickAccess", true);
        }
        // Set drawOrder (zIndex)
        layer.setZIndex(l.drawOrder);
        // Set opacity
        layer.setOpacity(l.opacity);
        // Special handling for layerGroups and baselayers
        if (layer.get("layerType") === "group") {
          if (l.visible === true) {
            const subLayersToShow = l.subLayers ? l.subLayers : [];
            globalObserver.publish("layerswitcher.showLayer", {
              layer,
              subLayersToShow,
            });
          } else {
            globalObserver.publish("layerswitcher.hideLayer", layer);
          }
        } else if (
          layer.get("layerType") === "base" &&
          replaceExistingBackgroundLayer
        ) {
          // Hide all other background layers
          globalObserver.publish(
            "layerswitcher.backgroundLayerChanged",
            layer.get("name")
          );
          // Set visibility
          layer.set("visible", l.visible);
        } else {
          layer.set("visible", l.visible);
        }
      } else if (l.id < 0 && replaceExistingBackgroundLayer) {
        // A fake maplayer is in the package
        // Hide all other background layers
        globalObserver.publish("layerswitcher.backgroundLayerChanged", l.id);
        // And set background color to map
        switch (l.id) {
          case "-2":
            document.getElementById("map").style.backgroundColor = "#000";
            break;
          case "-1":
          default:
            document.getElementById("map").style.backgroundColor = "#FFF";
            break;
        }
      }
    });

    enqueueSnackbar(`${title} har nu lagts till i snabblager.`, {
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
    // Also, remove potential fake background layers included in the package
    if (layers.length > 0) {
      // Fake maplayers have id below 0
      layers = layers.filter((l) => l.id > 0);
    }
    // At this point, the layers array will only contain the layers that don't exist in map.getAllLayers() or is a fake mapLayer
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

  // Function that finds a layer by id and returns caption
  const getBaseLayerName = (layers) => {
    let backgroundLayerName = "Bakgrundskarta hittades inte";
    layers.forEach((layer) => {
      const mapLayer = map
        .getAllLayers()
        .find((l) => l.get("name") === layer.id);
      if (mapLayer && mapLayer.get("layerType") === "base") {
        backgroundLayerName = mapLayer.get("caption");
      } else if (layer.id < 0) {
        // A fake maplayer is in the package
        switch (layer.id) {
          case "-2":
            backgroundLayerName = "Svart";
            break;
          case "-1":
          default:
            backgroundLayerName = "Vit";
            break;
        }
      }
    });
    return backgroundLayerName;
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
          {loadLpInfoConfirmation ? (
            <Stack sx={{ mt: 2 }} direction="row" spacing={1}>
              {loadLpInfoConfirmation.keywords.map((k) => (
                <Chip
                  key={`chip-${k}`}
                  label={k}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          ) : (
            ""
          )}
          <DialogContentText sx={{ mt: 2, mb: 1 }}>Bakgrund</DialogContentText>
          <Stack direction="row" spacing={1}>
            <PublicOutlinedIcon fontSize="small"></PublicOutlinedIcon>
            <Typography>
              {loadLpInfoConfirmation &&
                getBaseLayerName(loadLpInfoConfirmation.layers)}
            </Typography>
          </Stack>
          <DialogContentText sx={{ mt: 2, mb: 1 }}>
            Alternativ vid laddning
          </DialogContentText>
          <FormGroup>
            <FormControl
              sx={{ my: 1, minWidth: 120, maxWidth: 300 }}
              size="small"
            >
              <InputLabel
                shrink
                htmlFor="clearExistingQuickAccessLayers-select"
              >
                Snabblager
              </InputLabel>
              <Select
                value={clearExistingQuickAccessLayers}
                onChange={(event) =>
                  setClearExistingQuickAccessLayers(event.target.value)
                }
                label="Snabblager"
                id="clearExistingQuickAccessLayers-select"
              >
                <MenuItem value={true}>Ersätt befintliga lager</MenuItem>
                <MenuItem value={false}>Behåll befintliga lager</MenuItem>
              </Select>
            </FormControl>
            <FormControl
              sx={{ mb: 1, mt: 2, minWidth: 120, maxWidth: 300 }}
              size="small"
            >
              <InputLabel
                shrink
                htmlFor="replaceExistingBackgroundLayer-select"
              >
                Bakgrund
              </InputLabel>
              <Select
                value={replaceExistingBackgroundLayer}
                onChange={(event) =>
                  setReplaceExistingBackgroundLayer(event.target.value)
                }
                label="Snabblager"
                id="replaceExistingBackgroundLayer-select"
              >
                <MenuItem value={true}>Ersätt bakgrund</MenuItem>
                <MenuItem value={false}>Behåll bakgrund</MenuItem>
              </Select>
            </FormControl>
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoadConfirmationAbort}>Avbryt</Button>
          <Button
            onClick={() => handleLoadConfirmation(true)}
            variant="contained"
          >
            Lägg till
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
        <DialogTitle>Lägg till lagerpaket</DialogTitle>
        <DialogContent>
          <Typography>
            {loadLpConfirmation
              ? `Lagerpaketet ${loadLpConfirmation.title} läggs nu till i snabblager.`
              : ""}
            <br></br>
          </Typography>
          <DialogContentText sx={{ mt: 2, mb: 1 }}>
            Alternativ vid laddning
          </DialogContentText>
          <FormGroup>
            <FormControl
              sx={{ my: 1, minWidth: 120, maxWidth: 300 }}
              size="small"
            >
              <InputLabel
                shrink
                htmlFor="clearExistingQuickAccessLayers-select"
              >
                Snabblager
              </InputLabel>
              <Select
                value={clearExistingQuickAccessLayers}
                onChange={(event) =>
                  setClearExistingQuickAccessLayers(event.target.value)
                }
                label="Snabblager"
                id="clearExistingQuickAccessLayers-select"
              >
                <MenuItem value={true}>Ersätt befintliga lager</MenuItem>
                <MenuItem value={false}>Behåll befintliga lager</MenuItem>
              </Select>
            </FormControl>
            <FormControl
              sx={{ mb: 1, mt: 2, minWidth: 120, maxWidth: 300 }}
              size="small"
            >
              <InputLabel
                shrink
                htmlFor="replaceExistingBackgroundLayer-select"
              >
                Bakgrund
              </InputLabel>
              <Select
                value={replaceExistingBackgroundLayer}
                onChange={(event) =>
                  setReplaceExistingBackgroundLayer(event.target.value)
                }
                label="Snabblager"
                id="replaceExistingBackgroundLayer-select"
              >
                <MenuItem value={true}>Ersätt bakgrund</MenuItem>
                <MenuItem value={false}>Behåll bakgrund</MenuItem>
              </Select>
            </FormControl>
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoadConfirmationAbort}>Avbryt</Button>
          <Button
            onClick={() => handleLoadConfirmation(false)}
            variant="contained"
          >
            Lägg till
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
              <Typography variant="subtitle1">Lägg till lagerpaket</Typography>
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
                Här kan du lägga till fördefinierade lagerpaket till snabblager.
                Paketen innehåller tända och släckta lager med en
                bakgrundskarta.
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
