import * as React from "react";
import { useSnackbar } from "notistack";

import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";

import FolderOpen from "@mui/icons-material/FolderOpen";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import Save from "@mui/icons-material/Save";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Menu } from "@mui/material";

export default function DrawOrderOptions({
  app,
  filterList,
  setFilterList,
  map,
}) {
  // Prepare the Snackbar - we want to display nice messages when
  // user saves/restores layers.
  const { enqueueSnackbar } = useSnackbar();

  // Element that we will anchor the options menu to is
  // held in state. If it's null (unanchored), we can tell
  // that the menu should be hidden.
  const [anchorEl, setAnchorEl] = React.useState(null);
  const optionsMenuIsOpen = Boolean(anchorEl);

  // Show the options menu by setting an anchor element
  const handleShowMoreOptionsClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  // Hides the options menu by resetting the anchor element
  const handleCloseOptionsMenu = () => {
    setAnchorEl(null);
  };

  /**
   * Take care of saving active layers so that they can be restored layer.
   * For time being we're only saving in local storage, but this may change
   * in the future.
   * We take care of saving **all non-system layers**.
   * We save the opacity as well as the layers' internal order (by reading
   * the value of zIndex).
   */
  const handleSave = () => {
    // Grab layers to be saved by…
    const savedLayers = map
      .getAllLayers() //
      .filter((l) => l.getVisible() === true && l.get("layerType") !== "system") // …filtering out system layers.
      .map((l) => {
        // Create an array of objects. For each layer, we want to read its…
        return { i: l.get("name"), z: l.getZIndex(), o: l.getOpacity() }; // …name, zIndex and opacity.
      });

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
      numberOfLayers: savedLayers.length,
      ...(mapName && { mapName }), // …if we have a map name, let's add it too.
    };

    // Let's combine it all to an object that will be saved.
    const objectToSave = { savedLayers, metadata };

    // TODO: Determine whether this should be a functional or required cookie,
    // add the appropriate hook and describe here https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk.
    localStorage.setItem(
      "plugin.layerswitcher.savedLayers",
      JSON.stringify(objectToSave) // Remember to stringify prior storing in local storage.
    );

    enqueueSnackbar(`${metadata.numberOfLayers} lager sparades utan problem`, {
      variant: "success",
    });
  };

  const handleRestore = () => {
    // Let's be safe about parsing JSON
    try {
      const { metadata, savedLayers } = JSON.parse(
        localStorage.getItem("plugin.layerswitcher.savedLayers")
      );

      map
        .getAllLayers() // Traverse all layers…
        .filter((l) => l.get("layerType") !== "system") // …ignore system layers.
        .forEach((l) => {
          // See if the current layer is in the list of saved layers.
          const match = savedLayers.find((rl) => rl.i === l.get("name"));
          // If yes…
          if (match) {
            // …read and set some options.
            l.setZIndex(match.z);
            l.setOpacity(match.o);
            l.setVisible(true);
          } else {
            // If not, ensure that the layer is hidden.
            l.setVisible(false);
          }
        });

      enqueueSnackbar(
        `${metadata.numberOfLayers} lager återställdes från tidigare session`,
        {
          variant: "success",
        }
      );
    } catch (error) {
      enqueueSnackbar(
        "Innan du kan återställa måste du spara dina befintliga lager först."
      );
    }
  };

  // Handler function for the show/hide system layers toggle
  const handleSystemLayerSwitchChange = () => {
    if (filterList.has("system")) {
      filterList.delete("system");
      setFilterList(new Set(filterList));
    } else {
      filterList.add("system");
      setFilterList(new Set(filterList));
    }
  };

  return (
    <>
      <Button
        aria-controls={optionsMenuIsOpen ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={optionsMenuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        Fler alternativ
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={optionsMenuIsOpen}
        onClose={handleCloseOptionsMenu}
      >
        <MenuItem
          onClick={() => {
            handleSave();
            handleCloseOptionsMenu();
          }}
        >
          <ListItemIcon>
            <Save fontSize="small" />
          </ListItemIcon>
          <ListItemText>Spara aktiva lager</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleRestore();
            handleCloseOptionsMenu();
          }}
        >
          <ListItemIcon>
            <FolderOpen fontSize="small" />
          </ListItemIcon>
          <ListItemText>Återställ sparade lager</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleSystemLayerSwitchChange();
            handleCloseOptionsMenu();
          }}
        >
          <ListItemIcon>
            <GppMaybeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{`${
            filterList.has("system") ? "Dölj" : "Visa"
          } systemlager`}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
