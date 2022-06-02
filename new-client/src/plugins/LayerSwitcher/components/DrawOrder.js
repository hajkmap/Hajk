import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { IconButton } from "@mui/material";

import LayersIcon from "@mui/icons-material/Layers";
import WallpaperIcon from "@mui/icons-material/Wallpaper";

function DrawOrder({ app, map }) {
  const [filterList, setFilterList] = useState(
    new Set(["layer", "group"]) // Also "base" and "system" are available, but let's start without them
  );

  const updateSortedLayers = useCallback(() => {
    return map
      .getAllLayers()
      .filter((l) => {
        l.getZIndex() === undefined && l.setZIndex(-2);
        return (
          l.getVisible() === true &&
          Array.from(filterList).includes(l.get("layerType"))
        );
      })
      .sort((a, b) => a.getZIndex() < b.getZIndex());
  }, [filterList, map]);

  useEffect(() => {
    app.globalObserver.subscribe("core.layerVisibilityChanged", (l) => {
      setSortedLayers(updateSortedLayers());
    });
  }, [app.globalObserver, updateSortedLayers]);

  const [sortedLayers, setSortedLayers] = useState(updateSortedLayers());

  useEffect(() => {
    setSortedLayers(updateSortedLayers());
  }, [filterList, setSortedLayers, updateSortedLayers]);

  const getVisibleLayers = () =>
    map
      .getAllLayers()
      .filter((l) => {
        l.getZIndex() === undefined && l.setZIndex(-2);
        return (
          l.getVisible() === true &&
          Array.from(filterList).includes(l.get("layerType"))
        );
      })
      .sort((a, b) => a.getZIndex() < b.getZIndex());

  const changeOrder = (layer, direction) => {
    const oldZIndex = layer.getZIndex() || 0;
    let zIndexToBypass = null;
    let otherAffectedLayers = null;
    if (direction > 0) {
      // Increasing zIndex. We want to get everything above current layer and increase it too.
      otherAffectedLayers = getVisibleLayers().filter(
        (l) => l.getZIndex() >= oldZIndex && layer !== l // Make sure to ignore current layer
      );

      // Abort if there are no layers above the current one
      if (otherAffectedLayers.length === 0) return;

      // Now we have a list of layers that are above the one we want to lift. Next thing to do
      // is grab the _last_ layer in this list. That will be the layer that we want to "go above".
      // The .pop() below does two things: it grabs the layer (so we can get it's zIndex) and it
      // removes it from the array of other affected layers. We don't want to increase this one
      // layer's zIndex (as opposed to everything else!).
      const layerToGoAbove = otherAffectedLayers.pop();
      zIndexToBypass = layerToGoAbove.getZIndex();
    } else {
      otherAffectedLayers = getVisibleLayers().filter(
        (l) => l.getZIndex() <= oldZIndex && layer !== l // Make sure to ignore current layer
      );

      // Abort if there are no layers below the current one
      if (otherAffectedLayers.length === 0) return;
      const layerToGoBelow = otherAffectedLayers.shift();
      zIndexToBypass = layerToGoBelow.getZIndex();
    }
    otherAffectedLayers.forEach((la) =>
      la.setZIndex(la.getZIndex() + direction)
    );

    layer.setZIndex(zIndexToBypass + direction);

    setSortedLayers(updateSortedLayers());
  };

  const toggleSystemLayers = (e) => {
    const v = e.target.checked;
    if (v === true) {
      filterList.add("system");
      filterList.add("base");
      setFilterList(new Set(filterList));
    } else {
      filterList.delete("system");
      filterList.delete("base");
      setFilterList(new Set(filterList));
    }
  };

  return (
    <Box>
      <FormGroup sx={{ p: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={filterList.has("system")}
              onChange={toggleSystemLayers}
            />
          }
          label="Visa system- och bakgrundslager"
        />
      </FormGroup>

      <List>
        {sortedLayers.map((l, i) => {
          return (
            <ListItem key={i} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {l.get("layerType") === "layer" ? (
                    <LayersIcon />
                  ) : (
                    <WallpaperIcon />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={l.get("caption")}
                  secondary={"z-index:" + l.getZIndex()}
                />
                <IconButton onClick={() => changeOrder(l, +1)}>
                  <ArrowUpward />
                </IconButton>
                <IconButton onClick={() => changeOrder(l, -1)}>
                  <ArrowDownward />
                </IconButton>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default DrawOrder;
