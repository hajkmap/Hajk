import React, { useState } from "react";

import {
  Box,
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
} from "@mui/material";

import LegendIcon from "./LegendIcon";
import LegendImage from "./LegendImage";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";

export default function SubLayerItem({
  layer,
  subLayer,
  toggleable,
  app,
  display,
  visible,
  toggleSubLayer,
  subLayerIndex,
  zoomVisible,
}) {
  // State that toggles legend collapse
  const [legendIsActive, setLegendIsActive] = useState(false);
  // Render method for checkbox icon
  const getLayerToggleIcon = () => {
    return visible ? (
      <CheckBoxIcon
        sx={{
          fill: (theme) =>
            !zoomVisible ? theme.palette.warning.dark : theme.palette.primary,
        }}
      />
    ) : (
      <CheckBoxOutlineBlankIcon />
    );
  };

  // Show layer details action
  const showLayerDetails = (e) => {
    e.stopPropagation();
    app.globalObserver.publish("setLayerDetails", {
      layer: layer,
      subLayerIndex: subLayerIndex,
    });
  };

  // Render method for legend icon
  const getIconFromLayer = () => {
    if (layer.layersInfo[subLayer].legendIcon) {
      return <LegendIcon url={layer.layersInfo[subLayer].legendIcon} />;
    }
    return renderLegendIcon();
  };

  const renderLegendIcon = () => {
    return (
      <Tooltip
        placement="left"
        title={
          legendIsActive ? "Dölj teckenförklaring" : "Visa teckenförklaring"
        }
      >
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setLegendIsActive(!legendIsActive);
          }}
        >
          <FormatListBulletedOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <div style={{ display: display }}>
      <ListItemButton
        disableRipple
        onClick={() => (toggleable ? toggleSubLayer(subLayer, visible) : null)}
        sx={{
          borderBottom: (theme) =>
            `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
        }}
        dense
      >
        {toggleable && (
          <IconButton
            disableRipple
            sx={{
              pl: 0,
              pr: "5px",
            }}
          >
            {getLayerToggleIcon()}
          </IconButton>
        )}
        {getIconFromLayer()}
        <ListItemText
          primary={layer.layersInfo[subLayer].caption}
          primaryTypographyProps={{
            fontWeight: visible ? (toggleable ? "bold" : "inherit") : "inherit",
          }}
        />
        <ListItemSecondaryAction>
          <IconButton size="small" onClick={(e) => showLayerDetails(e)}>
            <KeyboardArrowRightOutlinedIcon
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            ></KeyboardArrowRightOutlinedIcon>
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
      {layer.layersInfo[subLayer].legendIcon ? null : (
        <Box sx={{ pl: toggleable ? 3.5 : 5.5 }}>
          <LegendImage
            layerItemDetails={{ layer: layer }}
            open={legendIsActive}
            subLayerIndex={subLayerIndex}
          ></LegendImage>
        </Box>
      )}
    </div>
  );
}
