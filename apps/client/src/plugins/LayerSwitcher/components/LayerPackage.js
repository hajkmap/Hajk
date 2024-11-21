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
  Divider,
} from "@mui/material";

import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";

function LayerPackage({
  display,
  backButtonCallback,
  quickLayerPresets,
  map,
  globalObserver,
  layerPackageInfoText,
}) {
  const { enqueueSnackbar } = useSnackbar();
  // State that toggles info collapse
  const [infoIsActive, setInfoIsActive] = useState(false);
  // Confirmation dialogs
  const [loadLpConfirmation, setLoadLpConfirmation] = useState(null);
  const [loadLpInfoConfirmation, setLoadLpInfoConfirmation] = useState(null);
  const [missingLayersConfirmation, setMissingLayersConfirmation] =
    useState(null);

  // Because of a warning in dev console, we need special handling of tooltip for backbutton.
  // When a user clicks back, the tooltip of the button needs to be closed before this view hides.
  // TODO: Needs a better way to handle this
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const quickLayerPresetsArray = quickLayerPresets || [];
  console.log({ quickLayerPresetsArray });
  // Filter state
  const [filter, setFilter] = useState({
    query: "",
    list: quickLayerPresetsArray,
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

  // Handles click on info button in list
  const handleLpInfoClick = (qlp) => {
    setLoadLpInfoConfirmation(qlp);
  };

  // Handles filter functionality
  const handleFilterChange = (value) => {
    const results = quickLayerPresetsArray.filter((data) => {
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
    clearQuickAccessLayers();
    resetVisibleLayers();
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
        } else if (layer.get("layerType") === "base") {
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
      } else if (l.id < 0) {
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

    enqueueSnackbar(`${title} har nu laddats till snabbåtkomst.`, {
      variant: "success",
      anchorOrigin: { vertical: "bottom", horizontal: "center" },
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

  // Reset visible layers
  const resetVisibleLayers = () => {
    map
      .getAllLayers()
      .filter((l) => l.get("visible") === true)
      .forEach((l) => {
        if (l.get("layerType") === "group") {
          globalObserver.publish("layerswitcher.hideLayer", l);
        } else if (l.get("layerType") !== "system") {
          l.set("visible", false);
        }
      });
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

  // Render layerpackage keywords
  const renderKeywords = (keywords) => {
    // Check if keywords is an array and if it contains any items
    if (Array.isArray(keywords) && keywords.length > 0) {
      // Check if keywords contains any empty strings
      const nonEmptyKeywords = keywords.filter(
        (keyword) => keyword.trim() !== ""
      );
      if (nonEmptyKeywords.length > 0) {
        return (
          <Stack sx={{ mt: 2 }} direction="row" spacing={1}>
            {nonEmptyKeywords.map((k) => (
              <Chip
                key={`chip-${k}`}
                label={k}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
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
          {loadLpInfoConfirmation
            ? renderKeywords(loadLpInfoConfirmation.keywords)
            : null}
          <DialogContentText sx={{ mt: 2, mb: 1 }}>Bakgrund</DialogContentText>
          <Stack direction="row" spacing={1}>
            <PublicOutlinedIcon fontSize="small"></PublicOutlinedIcon>
            <Typography>
              {loadLpInfoConfirmation &&
                getBaseLayerName(loadLpInfoConfirmation.layers)}
            </Typography>
          </Stack>
          <Divider sx={{ mt: 2 }} />
          <Typography sx={{ mt: 2, mb: 1 }}>
            Vid laddning kommer aktuella lager i snabbåtkomst att ersättas med
            temat. Alla tända lager i kartan släcks och ersätts med temats tända
            lager.
          </Typography>
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
        <DialogTitle>Ladda tema</DialogTitle>
        <DialogContent>
          <Typography>
            {loadLpConfirmation
              ? `Aktuella lager i snabbåtkomst kommer nu att ersättas med tema "${loadLpConfirmation.title}". Alla tända lager i kartan släcks och ersätts med temats tända lager.`
              : ""}
            <br></br>
          </Typography>
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
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "#373737"
                : theme.palette.grey[100],
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
              <Typography variant="subtitle1">Teman</Typography>
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
                {layerPackageInfoText}
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
              sx={{
                background: (theme) =>
                  theme.palette.mode === "dark" ? "inherit" : "#fff",
              }}
            />
          </Box>
        </Box>
        <Box>
          <List dense sx={{ p: 0 }}>
            {!filter.list.length ? (
              <Typography sx={{ p: 2 }}>
                {quickLayerPresetsArray.length === 0 ? (
                  <span>Inga lagerpaket är konfigurerade</span>
                ) : (
                  <span>Din filtrering gav inga resultat</span>
                )}
              </Typography>
            ) : (
              filter.list.map((l) => {
                return (
                  <ListItemButton
                    dense
                    key={l.id}
                    divider
                    onClick={() => handleLpClick(l)}
                  >
                    <ListItemIcon sx={{ px: 0, minWidth: "34px" }}>
                      <TopicOutlinedIcon fontSize="small" />
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
              })
            )}
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
