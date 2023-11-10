import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSnackbar } from "notistack";
import useCookieStatus from "hooks/useCookieStatus";

import LocalStorageHelper from "utils/LocalStorageHelper";
import FavoritesList from "./FavoritesList.js";
import FavoritesOptions from "./FavoritesOptions.js";
import FavoritesViewHeader from "./FavoritesViewHeader.js";
import ConfirmationDialog from "components/ConfirmationDialog.js";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
} from "@mui/material";

function Favorites({
  handleFavoritesViewToggle,
  app,
  map,
  favoriteViewDisplay,
  globalObserver,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [domReady, setDomReady] = useState(false);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [saveFavoriteDialog, setSaveFavoriteDialog] = useState(false);
  const [loadDialog, setLoadDialog] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [missingLayersConfirmation, setMissingLayersConfirmation] =
    useState(null);
  const [toggleFavoritesView, setToggleFavoritesView] = useState(false);
  const [openNoLayersAlert, setOpenNoLayersAlert] = useState(false);
  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  const { functionalCookiesOk } = useCookieStatus(globalObserver);

  useEffect(() => {
    // Set state from localstorage on component load
    const currentLsSettings = LocalStorageHelper.get("layerswitcher");
    if (currentLsSettings.savedLayers?.length > 0) {
      handleSetFavorites(currentLsSettings.savedLayers);
    }
    // Set dom ready flag to true
    setDomReady(true);
  }, []);

  useEffect(() => {
    // Save to storage when state changes occur
    const currentLsSettings = LocalStorageHelper.get("layerswitcher");

    // TODO: Determine whether this should be a functional or required cookie,
    // add the appropriate hook and describe here https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk.
    LocalStorageHelper.set("layerswitcher", {
      ...currentLsSettings,
      savedLayers: favorites,
    });
  }, [favorites]);

  // Handles click on add favorite button in menu
  const handleAddFavoriteClick = () => {
    if (getQuickAccessLayers().length > 0) {
      setSaveFavoriteDialog(!saveFavoriteDialog);
    } else {
      setOpenNoLayersAlert(true);
    }
  };

  const handleLoadFavorite = (favorite, showDialog, toggleView) => {
    setToggleFavoritesView(toggleView);
    setSelectedFavorite(favorite);
    if (showDialog) {
      setLoadDialog(!loadDialog);
    } else {
      loadFavorite(favorite, toggleView);
    }
  };

  const loadFavorite = (favorite, toggleView) => {
    setLoadDialog(false);
    favorite = favorite || selectedFavorite;
    // Check if layers from layerpackage exists in map
    const missingLayers = checkForMissingLayers(favorite.layers);
    if (missingLayers.length > 0) {
      // Show missing layers dialog
      setMissingLayersConfirmation({
        missingLayers: missingLayers,
        layers: favorite.layers,
        title: favorite.metadata.title,
      });
    } else {
      loadLayers(favorite.layers, favorite.metadata.title, toggleView);
    }
  };

  // Load layers to quickAccess section
  const loadLayers = (layers, title, toggleView) => {
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

    const doToggleView =
      toggleView !== undefined ? toggleView : toggleFavoritesView;

    if (doToggleView) {
      // Close favorites view on load
      handleFavoritesViewToggle({ setQuickAccessSectionExpanded: true });
    }
  };

  // Clear quickaccessLayers
  const clearQuickAccessLayers = () => {
    getQuickAccessLayers().map((l) => l.set("quickAccess", false));
  };

  // Reset visible layers
  const resetVisibleLayers = () => {
    map
      .getAllLayers()
      .filter((l) => l.get("visible") === true)
      .forEach((l) => {
        if (l.get("layerType") === "group") {
          globalObserver.publish("layerswitcher.hideLayer", l);
        } else {
          l.set("visible", false);
        }
      });
  };

  // Get quickaccess layers
  const getQuickAccessLayers = () => {
    return map.getAllLayers().filter((l) => l.get("quickAccess") === true);
  };

  const changeCookieSetting = () => {
    // Handles clicks on the "change-cookie-settings-button". Simply emits an event
    // on the global-observer, stating that the cookie-banner should be shown again.
    globalObserver.publish("core.showCookieBanner");
  };

  // Check if all layers in favorite package exist in map
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

  // Handles save favorite
  const handleSaveFavorite = () => {
    // Grab layers to be saved by…
    const layers = getQuickAccessLayers().map((l) => {
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
      enqueueSnackbar(
        "Inga lager i snabbåtkomst tillagda, därmed inget att spara.",
        {
          variant: "warning",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        }
      );
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
    const newFavorites = [...favorites];
    newFavorites.push(objectToSave);
    handleSetFavorites(newFavorites);
    setTitle("");
    setDescription("");

    enqueueSnackbar(`${metadata.title} har lagts till i favoriter.`, {
      variant: "success",
      anchorOrigin: { vertical: "bottom", horizontal: "center" },
    });
  };

  const handleRemoveFavorite = (selectedFavorite) => {
    // Clone added favorites
    let favoritesArray = [...favorites];
    // Get remaining favorites
    favoritesArray = favoritesArray.filter((f) => f !== selectedFavorite);
    // And set to state
    handleSetFavorites(favoritesArray);
    enqueueSnackbar(`${selectedFavorite.metadata.title} har tagits bort.`, {
      variant: "success",
      anchorOrigin: { vertical: "bottom", horizontal: "center" },
    });
  };

  const handleSetFavorites = (newFavorites) => {
    // Sort favorites by title and saved date
    const sortedFavorites = newFavorites.sort((a, b) => {
      // Compare titles
      const titleComparison = a.metadata.title.localeCompare(b.metadata.title);
      // If titles are equal, compare saved dates
      if (titleComparison === 0) {
        return new Date(b.metadata.savedAt) - new Date(a.metadata.savedAt);
      }
      return titleComparison;
    });
    // And set to state
    setFavorites(sortedFavorites);
  };

  // Handles edit favorite title and description
  const handleEditFavorite = (selectedFavorite, editTitle, editDescription) => {
    const index = favorites.findIndex((lp) => lp === selectedFavorite);
    // Clone added favorites
    const favoritesArray = [...favorites];
    // Create a new updated object
    const updatedObject = {
      ...favoritesArray[index],
      metadata: {
        ...favoritesArray[index].metadata,
        title: editTitle,
        description: editDescription,
      },
    };
    // Replace with updatedObject
    favoritesArray[index] = updatedObject;

    // And set to state
    handleSetFavorites(favoritesArray);

    enqueueSnackbar(`Favoriten uppdaterades utan problem`, {
      variant: "success",
      anchorOrigin: { vertical: "bottom", horizontal: "center" },
    });
  };

  // Fires when the user closes the missing layers-window.
  const handleMissingLayersConfirmationAbort = () => {
    setMissingLayersConfirmation(null);
  };

  const handleImportFavorites = (parsedFavorites) => {
    const favoritesArray = [...favorites];
    favoritesArray.push(parsedFavorites);
    handleSetFavorites(favoritesArray);
    enqueueSnackbar(`Favoriten importerades utan problem`, {
      variant: "success",
      anchorOrigin: { vertical: "bottom", horizontal: "center" },
    });
  };

  const renderFavoritesView = () => {
    return createPortal(
      <Box sx={{ display: favoriteViewDisplay ? "block" : "none" }}>
        <FavoritesViewHeader
          importFavoritesCallback={handleImportFavorites}
          backButtonCallback={handleFavoritesViewToggle}
          functionalCookiesOk={functionalCookiesOk}
        ></FavoritesViewHeader>
        <Box>
          <FavoritesList
            map={map}
            favorites={favorites}
            editCallback={handleEditFavorite}
            loadFavoriteCallback={handleLoadFavorite}
            removeCallback={handleRemoveFavorite}
            functionalCookiesOk={functionalCookiesOk}
            cookieSettingCallback={changeCookieSetting}
          ></FavoritesList>
        </Box>
      </Box>,
      document.getElementById("scroll-container")
    );
  };

  // Render dialog with missing layers information
  const renderMissingLayersDialog = () => {
    return createPortal(
      <Dialog
        open={missingLayersConfirmation ? true : false}
        onClose={handleMissingLayersConfirmationAbort}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
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
              `Det kan bero på att lagret har utgått. Vänligen kontrollera och uppdatera favoriten.`}
            <br></br>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleMissingLayersConfirmationAbort();
            }}
          >
            Avbryt
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              loadLayers(
                missingLayersConfirmation.layers,
                missingLayersConfirmation.title
              );
            }}
            variant="contained"
          >
            Fortsätt
          </Button>
        </DialogActions>
      </Dialog>,
      document.getElementById("map")
    );
  };

  const renderAddFavoriteDialog = () => {
    return createPortal(
      <Dialog
        open={saveFavoriteDialog}
        aria-labelledby="saveFavorite-dialog-title"
        aria-describedby="save-favorite-dialog-description"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogTitle id="saveFavorite-dialog-title">
          Lägg till favorit
        </DialogTitle>
        <DialogContent>
          <Typography id="save-favorite-dialog-description" sx={{ mb: 1 }}>
            Spara aktuell snabbåtkomst som en favorit lokalt på din enhet så att
            du kan använda den senare.
          </Typography>
          <TextField
            fullWidth
            id="save-favorite-title"
            label="Titel"
            variant="standard"
            sx={{ mb: 1 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            fullWidth
            id="save-favorite-description"
            label="Beskrivning"
            multiline
            maxRows={4}
            variant="standard"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setSaveFavoriteDialog(!saveFavoriteDialog);
            }}
          >
            Avbryt
          </Button>
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              setSaveFavoriteDialog(!saveFavoriteDialog);
              handleSaveFavorite();
            }}
            autoFocus
          >
            Spara
          </Button>
        </DialogActions>
      </Dialog>,
      document.getElementById("map")
    );
  };

  return (
    <>
      <FavoritesOptions
        favorites={favorites}
        handleFavoritesViewToggle={handleFavoritesViewToggle}
        addFavoriteCallback={handleAddFavoriteClick}
        loadFavoriteCallback={handleLoadFavorite}
        functionalCookiesOk={functionalCookiesOk}
      ></FavoritesOptions>
      {domReady && renderFavoritesView()}
      <ConfirmationDialog
        open={loadDialog}
        titleName={"Ladda favorit"}
        contentDescription="Vid laddning ersätts lagren i snabbåtkomst. Alla tända lager i
				kartan släcks och ersätts med favoritens tända lager."
        cancel={"Avbryt"}
        confirm={"Ladda"}
        handleConfirm={loadFavorite}
        handleAbort={() => {
          setLoadDialog(!loadDialog);
        }}
      />
      <ConfirmationDialog
        open={openNoLayersAlert}
        titleName={"Spara favorit"}
        contentDescription="Det finns inga lager i snabbåtkomst. Vänligen lägg till lager för att spara favorit."
        cancel={"Stäng"}
        handleAbort={() => {
          setOpenNoLayersAlert(false);
        }}
      ></ConfirmationDialog>
      {renderAddFavoriteDialog()}
      {renderMissingLayersDialog()}
    </>
  );
}

export default Favorites;
