import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSnackbar } from "notistack";
import LocalStorageHelper from "utils/LocalStorageHelper";
import { saveAs } from "file-saver";

import {
  Button,
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  InputLabel,
  FormGroup,
  FormControl,
  MenuItem,
  TextField,
  Tooltip,
  Collapse,
  Typography,
  Select,
  Stack,
  Divider,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

function PersonalLayerPackage({
  display,
  backButtonCallback,
  map,
  globalObserver,
  app,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  // State that toggles info collapse
  const [infoIsActive, setInfoIsActive] = useState(false);
  // Confirmation dialog
  const [loadLpConfirmation, setLoadLpConfirmation] = useState(null);
  const [missingLayersConfirmation, setMissingLayersConfirmation] =
    useState(null);
  const [clearExistingQuickAccessLayers, setClearExistingQuickAccessLayers] =
    useState(true);
  const [replaceExistingBackgroundLayer, setReplaceExistingBackgroundLayer] =
    useState(true);
  const [addWsIsActive, setAddWsIsActive] = useState(null);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [expandedItem, setExpandedItem] = useState(null);
  const [removeAlert, setRemoveAlert] = useState(false);
  const [editAlert, setEditAlert] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const [personalLayerPackages, setPersonalLayerPackages] = useState([]);

  // Because of a warning in dev console, we need special handling of tooltip for backbutton.
  // When a user clicks back, the tooltip of the button needs to be closed before this view hides.
  // TODO: Needs a better way to handle this
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    // Set state from localstorage on component load
    const currentLsSettings = LocalStorageHelper.get("layerswitcher");
    if (currentLsSettings.savedLayers?.length > 0) {
      setPersonalLayerPackages(currentLsSettings.savedLayers);
    }
  }, []);

  useEffect(() => {
    // Save to storage when state changes occur
    const currentLsSettings = LocalStorageHelper.get("layerswitcher");

    // TODO: Determine whether this should be a functional or required cookie,
    // add the appropriate hook and describe here https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk.
    LocalStorageHelper.set("layerswitcher", {
      ...currentLsSettings,
      savedLayers: personalLayerPackages,
    });
  }, [personalLayerPackages]);

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

  // Fires when the user closes the missing layers-window.
  const handleMissingLayersConfirmationAbort = () => {
    setMissingLayersConfirmation(null);
  };

  // Handles click on upload button in header
  const handleImportButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
          const parsedLayerPackage = JSON.parse(contents);

          if (parsedLayerPackage.layers?.length > 0) {
            // Add it to collection
            const layerPackages = [...personalLayerPackages];
            layerPackages.push(parsedLayerPackage);
            setPersonalLayerPackages(layerPackages);
            enqueueSnackbar(`Snabblager importerades utan problem`, {
              variant: "success",
            });
          }
        } catch (error) {
          console.error(`Layer package could not be parsed. Error: ${error}`);
          enqueueSnackbar(
            "Lagerpaketet kunde inte laddas, kontrollera att .json filen ser korrekt ut.",
            { variant: "error" }
          );
        }
      };
    }
  };

  // Handle export layerpackage as json file
  const handleExportJsonClick = () => {
    try {
      new Blob();
    } catch {
      console.info("JSON export not supported on current platform.");
      return;
    }
    // Convert JSON-data to blob
    const blobData = new Blob([JSON.stringify(expandedItem, null, 2)], {
      type: "application/json",
    });

    saveAs(
      blobData,
      `${expandedItem.metadata.title} - ${new Date().toLocaleString()}.json`
    );
  };

  // Handles save workspace
  const handleSaveWorkspace = () => {
    // Grab layers to be saved by…
    const layers = map
      .getAllLayers() //
      .filter((l) => l.get("quickAccess") === true)
      .map((l) => {
        // Create an array of objects. For each layer, we want to read its…
        return {
          id: l.get("name"),
          visible: l.getVisible(),
          subLayers: l.get("layerType") === "group" ? l.get("subLayers") : [],
          opacity: l.getOpacity(),
          drawOrder: l.getZIndex(),
        }; // …name as id, visibility and potentially sublayers.
      });

    if (layers.length === 0) {
      enqueueSnackbar("Inga snabblager tillagda, därmed inget att spara.", {
        variant: "warning",
      });
      return;
    }

    // Also, grab current baselayer and add it to the layers array.
    const baseLayer = map
      .getLayers()
      .getArray()
      .find((l) => l.get("layerType") === "base" && l.getVisible());

    if (baseLayer) {
      layers.push({
        id: baseLayer.get("name"),
        visible: true,
        subLayers: [],
        opacity: baseLayer.getOpacity(),
        drawOrder: baseLayer.getZIndex(),
      });
    } else {
      // No "real" base layer is visible, so we need to check for a fake one (black or white).
      const currentBackgroundColor =
        document.getElementById("map").style.backgroundColor;
      const WHITE_BACKROUND_LAYER_ID = "-1";
      const BLACK_BACKROUND_LAYER_ID = "-2";
      layers.push({
        id:
          currentBackgroundColor === "rgb(0, 0, 0)"
            ? BLACK_BACKROUND_LAYER_ID
            : WHITE_BACKROUND_LAYER_ID,
        visible: true,
        subLayers: [],
        opacity: 1,
        drawOrder: -1,
      });
    }

    // Let's create some metadata about our saved layers. User might want to know
    // how many layers are saved and when they were saved.
    // First, we try to get the map's name. We can't be certain that this exists (not
    // all maps have the userSpecificMaps property), so we must be careful.
    const mapName =
      Array.isArray(app.config.userSpecificMaps) &&
      app.config.userSpecificMaps.find(
        (m) => m.mapConfigurationName === app.config.activeMap
      )?.mapConfigurationTitle;

    // Next, let's put together the metadata object…
    const metadata = {
      savedAt: new Date(),
      numberOfLayers: layers.length,
      title: title,
      description: description,
      ...(mapName && { mapName }), // …if we have a map name, let's add it too.
    };

    // Let's combine it all to an object that will be saved.
    const objectToSave = { layers, metadata };
    const layerPackages = [...personalLayerPackages];
    layerPackages.push(objectToSave);
    setPersonalLayerPackages(layerPackages);
    setTitle("");
    setDescription("");
    setAddWsIsActive(false);

    enqueueSnackbar(`Snabblager sparades utan problem`, {
      variant: "success",
    });
  };

  // Clear quickaccessLayers on load
  const clearQuickAccessLayers = () => {
    map
      .getAllLayers()
      .filter((l) => l.get("quickAccess") === true)
      .map((l) => l.set("quickAccess", false));
  };

  // Fires when the user confirms the confirmation-window.
  const handleLoadConfirmation = () => {
    let lpInfo = { ...loadLpConfirmation };

    setLoadLpConfirmation(null);

    // Check if layers from layerpackage exists in map
    const missingLayers = checkForMissingLayers(lpInfo.layers);
    if (missingLayers.length > 0) {
      // Show missing layers dialog
      setMissingLayersConfirmation({
        missingLayers: missingLayers,
        layers: lpInfo.layers,
        title: lpInfo.metadata.title,
      });
    } else {
      loadLayers(lpInfo.layers, lpInfo.metadata.title);
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

    // Close personalLayerPackage view on load
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

  // Fires when the user closes the confirmation-window.
  const handleLoadConfirmationAbort = () => {
    setLoadLpConfirmation(null);
  };

  // Handles backbutton tooltip close event
  const handleClose = () => {
    setTooltipOpen(false);
  };

  // Handles remove layer package
  const handleRemovePackageItem = () => {
    // Clone added layerPackages
    let layerPackagesArray = [...personalLayerPackages];
    // Get remaining layerPackages
    layerPackagesArray = layerPackagesArray.filter((lp) => lp !== expandedItem);
    // And set to state
    setPersonalLayerPackages(layerPackagesArray);
    setRemoveAlert(!removeAlert);
  };

  // Handles edit layer package title and description
  const handleEditPackageItem = () => {
    const index = personalLayerPackages.findIndex((lp) => lp === expandedItem);
    // Clone added layerPackages
    const layerPackagesArray = [...personalLayerPackages];
    // Create a new updated objectet
    const updatedObject = {
      ...layerPackagesArray[index],
      metadata: {
        ...layerPackagesArray[index].metadata,
        title: editTitle,
        description: editDescription,
      },
    };
    // Replace with updatedObject
    layerPackagesArray[index] = updatedObject;

    // And set to state
    setPersonalLayerPackages(layerPackagesArray);
    // Close alert
    setEditAlert(!editAlert);

    enqueueSnackbar(`Snabblager uppdaterades utan problem`, {
      variant: "success",
    });
  };

  // Handles backbutton tooltip open event
  const handleOpen = () => {
    setTooltipOpen(true);
  };

  // Parse date for prettier display
  const parseDate = (date) => {
    return new Date(date).toLocaleTimeString([], {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              `Det kan bero på att lagret har utgått. Vänligen kontrollera och uppdatera lagerpaketet.`}
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

  // Render dialog to load layerpackage
  const renderLoadDialog = () => {
    return createPortal(
      <Dialog
        open={loadLpConfirmation ? true : false}
        onClose={handleLoadConfirmationAbort}
      >
        <DialogTitle>Lägg till lager</DialogTitle>
        <DialogContent>
          <Typography>
            {loadLpConfirmation
              ? loadLpConfirmation.metadata.title +
                " läggs nu till i snabblager."
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
              <Typography variant="subtitle1">Mina snabblager</Typography>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />
            <IconButton onClick={handleImportButtonClick}>
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
              <Typography variant="subtitle2">
                Här kan du spara aktuella snabblager som lagerpaket lokalt på
                din egen enhet. För att ladda till snabblager, klicka på sparat
                paket.
              </Typography>
            </Box>
          </Collapse>
        </Box>
        <Box
          sx={{
            p: 2,
          }}
        >
          <Card
            sx={{
              border: (theme) =>
                `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
              borderRadius: "8px",
              boxShadow: "none",
              mb: 1,
            }}
          >
            <CardHeader
              onClick={() => setAddWsIsActive(!addWsIsActive)}
              sx={{
                py: 1,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.04)",
                },
                justifyContent: "center",
                "& .MuiCardHeader-content": {
                  flexGrow: 0,
                },
              }}
              action={
                <IconButton>
                  <ExpandMoreOutlinedIcon
                    sx={{
                      transform: addWsIsActive ? "rotate(180deg)" : "",
                      transition: "transform 300ms ease",
                    }}
                  ></ExpandMoreOutlinedIcon>
                </IconButton>
              }
              title={
                <Typography variant="subtitle1">Spara snabblager</Typography>
              }
            />
            <Collapse in={addWsIsActive} timeout="auto" unmountOnExit>
              <CardContent sx={{ pt: 1 }}>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  id="workspace-title"
                  label="Titel"
                  variant="standard"
                  sx={{ mb: 1 }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <TextField
                  fullWidth
                  id="workspace-description"
                  label="Beskrivning"
                  multiline
                  maxRows={4}
                  variant="standard"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </CardContent>
              <CardActions disableSpacing sx={{ justifyContent: "flex-end" }}>
                <Tooltip title="Avbryt">
                  <IconButton
                    onClick={() => {
                      setAddWsIsActive(!addWsIsActive);
                      setTitle("");
                      setDescription("");
                    }}
                    aria-label="Avbryt"
                  >
                    <CloseOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Spara">
                  <IconButton
                    onClick={() => handleSaveWorkspace()}
                    aria-label="Spara"
                  >
                    <SaveOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Collapse>
          </Card>
          {!personalLayerPackages.length
            ? "Inga snabblager finns sparade"
            : personalLayerPackages.map((l, index) => {
                return (
                  <Card
                    sx={{
                      border: (theme) =>
                        `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
                      borderRadius: "8px",
                      boxShadow: "none",
                      mb: 1,
                    }}
                    key={index}
                  >
                    <CardHeader
                      onClick={() => setLoadLpConfirmation(l)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.04)",
                        },
                      }}
                      action={
                        <IconButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedItem(expandedItem === l ? null : l);
                          }}
                        >
                          <ExpandMoreOutlinedIcon
                            sx={{
                              transform:
                                expandedItem === l ? "rotate(180deg)" : "",
                              transition: "transform 300ms ease",
                            }}
                          ></ExpandMoreOutlinedIcon>
                        </IconButton>
                      }
                      title={
                        <Typography variant="subtitle1">
                          {l.metadata.title}
                        </Typography>
                      }
                      subheader={
                        <Box sx={{ display: "flex", mt: 0.5 }}>
                          <LayersOutlinedIcon
                            sx={{ mr: 0.5 }}
                            fontSize="small"
                          />
                          {parseDate(l.metadata.savedAt)}
                        </Box>
                      }
                    />
                    <Collapse
                      in={expandedItem === l}
                      timeout="auto"
                      unmountOnExit
                    >
                      <CardContent sx={{ pt: 0 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          {l.metadata.description}
                        </Typography>
                      </CardContent>
                      <CardActions
                        disableSpacing
                        sx={{ justifyContent: "flex-end" }}
                      >
                        <Tooltip title="Exportera">
                          <IconButton
                            aria-label="Exportera"
                            onClick={handleExportJsonClick}
                          >
                            <FileDownloadOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Redigera">
                          <IconButton
                            aria-label="Editera"
                            onClick={() => {
                              setEditTitle(expandedItem.metadata.title);
                              setEditDescription(
                                expandedItem.metadata.description
                              );
                              setEditAlert(!editAlert);
                            }}
                          >
                            <EditOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ta bort">
                          <IconButton
                            onClick={() => setRemoveAlert(!removeAlert)}
                            aria-label="Ta bort"
                          >
                            <DeleteOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Collapse>
                  </Card>
                );
              })}
        </Box>
      </Box>
      {renderLoadDialog()}
      {renderMissingLayersDialog()}
      <Dialog
        open={removeAlert}
        aria-labelledby="removealert-dialog-title"
        aria-describedby="removealert-dialog-description"
      >
        <DialogTitle id="removealert-dialog-title">Bekräfta</DialogTitle>
        <DialogContent>
          Är du säker på att du vill ta bort arbetsytan?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleRemovePackageItem()} autoFocus>
            Ok
          </Button>
          <Button
            onClick={() => setRemoveAlert(!removeAlert)}
            variant="contained"
          >
            Avbryt
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={editAlert}
        aria-labelledby="editalert-dialog-title"
        aria-describedby="editalert-dialog-description"
      >
        <DialogTitle id="editalert-dialog-title">Redigera</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            id="edit-workspace-title"
            label="Titel"
            variant="standard"
            sx={{ mb: 1 }}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <TextField
            fullWidth
            id="edit-workspace-description"
            label="Beskrivning"
            multiline
            maxRows={4}
            variant="standard"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAlert(!editAlert)}>Avbryt</Button>
          <Button
            variant="contained"
            onClick={() => handleEditPackageItem()}
            autoFocus
          >
            Spara
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default PersonalLayerPackage;
