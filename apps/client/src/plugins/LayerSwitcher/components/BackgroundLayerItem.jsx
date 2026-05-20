import React, { useEffect, useState, useCallback, memo } from "react";

// Material UI components
import {
  Box,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import RadioButtonChecked from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";

import LsIconButton from "./LsIconButton";
import BtnShowDetails from "./BtnShowDetails";
import BtnLayerWarning from "./BtnLayerWarning";
import { getIsMobile } from "../LayerSwitcherUtils";
import HajkToolTip from "../../../components/HajkToolTip";

// TODO Remove all isfakemaplayer
function BackgroundLayerItem({
  layer,
  globalObserver,
  clickCallback,
  layerId,
  selected,
  isFakeMapLayer,
  draggable,
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
    <Box
      className="layer-item"
      style={{
        marginLeft: 0,
        borderBottom: "none",
        display: "flex",
      }}
      sx={
        draggable
          ? {
              "&:hover .dragInidcatorIcon": {
                opacity: 1,
              },
            }
          : {
              "&:hover .dragInidcatorIcon": {
                opacity: 0,
              },
            }
      }
    >
      {draggable && (
        <LsIconButton
          disableRipple
          sx={{
            px: 0,
            pt: "7px",
            opacity: 0,
            transition: "opacity 200ms",
          }}
          className="dragInidcatorIcon"
        >
          <HajkToolTip placement="left" title="Dra för att ändra ritordning">
            <DragIndicatorOutlinedIcon sx={{ pt: "1px" }} fontSize={"small"} />
          </HajkToolTip>
        </LsIconButton>
      )}
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
          sx={(theme) => ({
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "center",
            // jesade-vbg compact mode, changed from 0.5
            py: getIsMobile() ? 0.5 : 0.25,
            pr: 1,
            borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
          })}
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
            slotProps={{
              primary: {
                pr: 5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                variant: "body1",
                fontWeight: "inherit",
              },
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
    </Box>
  );
}

export default memo(BackgroundLayerItem);
