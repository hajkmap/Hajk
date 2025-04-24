import React, { useEffect, useState, useCallback, memo } from "react";

// Material UI components
import {
  Box,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

import RadioButtonChecked from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";

import LsIconButton from "./LsIconButton";
import BtnShowDetails from "./BtnShowDetails";
import BtnLayerWarning from "./BtnLayerWarning";
import { getIsMobile } from "../LayerSwitcherUtils";

// TODO Remove all isfakemaplayer
function BackgroundLayerItem({
  layer,
  globalObserver,
  clickCallback,
  layerId,
  selected,
  isFakeMapLayer,
}) {
  // WmsLayer load status, shows warning icon if !ok
  const [wmsLayerLoadStatus, setWmsLayerLoadStatus] = useState("ok");

  useEffect(() => {
    const handleLoadStatusChange = (d) => {
      if (wmsLayerLoadStatus !== "loaderror" && layer.get("name") === d.id) {
        setWmsLayerLoadStatus(d.status);
      }
    };

    // Subscribe to layer load status.
    const loadStatusSubscription = globalObserver.subscribe(
      "layerswitcher.wmsLayerLoadStatus",
      handleLoadStatusChange
    );

    // Cleanup function to unsubscribe when the component unmounts or if the
    // relevant dependencies change.
    return () =>
      globalObserver.unsubscribe(
        "layerswitcher.wmsLayerLoadStatus",
        loadStatusSubscription
      );
  }, [globalObserver, layer, wmsLayerLoadStatus]);

  // Show layer details action
  const showLayerDetails = useCallback(
    (e) => {
      e.stopPropagation();
      globalObserver.publish("setLayerDetails", { layerId: layer.get("name") });
    },
    [globalObserver, layer]
  );

  const name = layer.get("caption");

  return (
    <div
      className="layer-item"
      style={{
        marginLeft: 0,
        borderBottom: "none",
        display: "flex",
      }}
    >
      <ListItemButton
        disableTouchRipple
        onClick={() => clickCallback(layerId)}
        sx={{
          p: 0,
          ml: 0,
        }}
        dense
      >
        <Box
          sx={{
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "center",
            py: getIsMobile() ? 0.5 : 0.25, // jesade-vbg compact mode, changed from 0.5
            pr: 1,
            borderBottom: (theme) =>
              `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
          }}
        >
          <LsIconButton disableRipple size="small" sx={{ pl: 0 }}>
            {selected ? (
              <RadioButtonChecked sx={{ ml: 2 }} />
            ) : (
              <RadioButtonUnchecked sx={{ ml: 2 }} />
            )}
          </LsIconButton>
          <ListItemText
            primary={name}
            primaryTypographyProps={{
              pr: 5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              variant: "body1",
              fontWeight: "inherit",
            }}
          />
          <ListItemSecondaryAction
            sx={{
              position: "absolute",
              right: "4px",
              top: "1px",
              transform: "none",
            }}
          >
            {wmsLayerLoadStatus === "loaderror" && <BtnLayerWarning />}
            {isFakeMapLayer !== true && (
              <BtnShowDetails onClick={(e) => showLayerDetails(e)} />
            )}
          </ListItemSecondaryAction>
        </Box>
      </ListItemButton>
    </div>
  );
}

export default memo(BackgroundLayerItem);
