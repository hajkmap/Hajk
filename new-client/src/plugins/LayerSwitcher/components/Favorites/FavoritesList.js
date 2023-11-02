import React, { useState } from "react";
import { createPortal } from "react-dom";
import { saveAs } from "file-saver";

import FavoritePackageOptions from "./FavoritePackageOptions.js";
import ConfirmationDialog from "../../../../components/ConfirmationDialog.js";

import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";

function FavoritesList({
  favorites,
  loadFavoriteCallback,
  map,
  removeCallback,
  editCallback,
  functionalCookiesOk,
  cookieSettingCallback,
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [removeAlert, setRemoveAlert] = useState(false);
  const [editAlert, setEditAlert] = useState(false);
  const [infoAlert, setInfoAlert] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // Handles click on info button in menu
  const handleInfo = (lp) => {
    setSelectedItem(lp);
    setInfoAlert(!infoAlert);
  };

  // Handles click on edit button in menu
  const handleEdit = (lp) => {
    setSelectedItem(lp);
    setEditTitle(lp.metadata.title);
    setEditDescription(lp.metadata.description);
    setEditAlert(!editAlert);
  };

  // Handles remove favorite
  const handleRemoveFavorite = () => {
    removeCallback(selectedItem);
    setRemoveAlert(!removeAlert);
  };

  // Handles edit favorite
  const handleEditFavorite = () => {
    editCallback(selectedItem, editTitle, editDescription);
    setEditAlert(!editAlert);
  };

  // Handles click on delete button in menu
  const handleDelete = (lp) => {
    setSelectedItem(lp);
    setRemoveAlert(!removeAlert);
  };

  // Handles click on download button in menu
  const handleDownload = (lp) => {
    handleExportJsonClick(lp);
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

  // Handle export layerpackage as json file
  const handleExportJsonClick = (lp) => {
    try {
      new Blob();
    } catch {
      console.info("JSON export not supported on current platform.");
      return;
    }
    // Convert JSON-data to blob
    const blobData = new Blob([JSON.stringify(lp, null, 2)], {
      type: "application/json",
    });

    saveAs(
      blobData,
      `${lp.metadata.title} - ${new Date().toLocaleString()}.json`
    );
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
        open={infoAlert}
        aria-labelledby="infoalert-dialog-title"
        aria-describedby="infoalert-dialog-description"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogTitle sx={{ pb: 0 }} id="infoalert-dialog-title">
          {selectedItem ? selectedItem.metadata.title : ""}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ pb: 2 }}>
            {selectedItem && parseDate(selectedItem.metadata.savedAt)}
          </DialogContentText>
          <Typography>
            {selectedItem ? selectedItem.metadata.description : ""}
          </Typography>
          <DialogContentText sx={{ mt: 2, mb: 1 }}>Bakgrund</DialogContentText>
          <Stack direction="row" spacing={1}>
            <PublicOutlinedIcon fontSize="small"></PublicOutlinedIcon>
            <Typography>
              {selectedItem && getBaseLayerName(selectedItem.layers)}
            </Typography>
          </Stack>
          <Divider sx={{ mt: 2 }} />
          <Typography sx={{ mt: 2, mb: 1 }}>
            Vid laddning ersätts lagren i snabbåtkomst. Alla tända lager i
            kartan släcks och ersätts med favoritens tända lager.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setInfoAlert(false);
            }}
          >
            Avbryt
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              loadFavoriteCallback(selectedItem, false, true);
              setInfoAlert(false);
            }}
            variant="contained"
          >
            Ladda
          </Button>
        </DialogActions>
      </Dialog>,
      document.getElementById("map")
    );
  };

  const renderEditDialog = () => {
    return createPortal(
      <Dialog
        open={editAlert}
        aria-labelledby="editalert-dialog-title"
        aria-describedby="editalert-dialog-description"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
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
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setEditAlert(!editAlert);
            }}
          >
            Avbryt
          </Button>
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              handleEditFavorite();
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

  // A view that is rendered if the user has selected not to accept functional
  // cookies. (Functional cookies has to be accepted)
  const notSupportedView = () => {
    return (
      <Stack spacing={2} sx={{ p: 2 }}>
        <Typography variant="body2">
          Det ser ut som att du har valt att inte tillåta funktionella kakor. På
          grund av detta så kan du inte se dina sparade favoriter eller lägga
          till nya.
        </Typography>
        <Typography variant="body2">
          Klicka nedan för att ändra inställningarna.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            cookieSettingCallback();
          }}
        >
          Cookie-inställningar
        </Button>
      </Stack>
    );
  };

  return (
    <>
      {functionalCookiesOk ? (
        <List dense sx={{ p: 0 }}>
          {!favorites.length ? (
            <Typography sx={{ p: 2 }}>Inga favoriter finns sparade</Typography>
          ) : (
            favorites.map((favorite, index) => {
              return (
                <ListItemButton
                  disableRipple
                  dense
                  key={`lp${favorite.metadata.title}-${index}`}
                  divider
                  onClick={(e) => {
                    e.stopPropagation();
                    loadFavoriteCallback(favorite, true, true);
                  }}
                >
                  <ListItemIcon sx={{ px: 0, minWidth: "34px" }}>
                    <LayersOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={favorite.metadata.title}
                    secondary={parseDate(favorite.metadata.savedAt)}
                  />
                  <ListItemSecondaryAction>
                    <FavoritePackageOptions
                      infoCallback={handleInfo}
                      deleteCallback={handleDelete}
                      editCallback={handleEdit}
                      downloadCallback={handleDownload}
                      favorite={favorite}
                    ></FavoritePackageOptions>
                  </ListItemSecondaryAction>
                </ListItemButton>
              );
            })
          )}
        </List>
      ) : (
        notSupportedView()
      )}
      <ConfirmationDialog
        open={removeAlert}
        titleName={"Ta bort"}
        contentDescription={`Du kommer att ta bort "${
          selectedItem?.metadata.title
        }, ${parseDate(selectedItem?.metadata.savedAt)}" permanent.`}
        cancel={"Avbryt"}
        confirm={"Ta bort"}
        handleConfirm={handleRemoveFavorite}
        handleAbort={() => {
          setRemoveAlert(!removeAlert);
        }}
      />
      {renderEditDialog()}
      {renderInfoDialog()}
    </>
  );
}

export default FavoritesList;
