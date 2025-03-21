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
  layerId,
  layerConfig,
  subLayer,
  toggleable,
  globalObserver,
  visible,
  toggleSubLayer,
  zoomVisible,
}) {
  const layersInfo = layerConfig.layerInfo.layersInfo;
  const subLayerInfo = layersInfo[subLayer];

  const subLayerIndex = layerConfig.allSubLayers.findIndex(
    (sl) => sl === subLayer
  );

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
    globalObserver.publish("setLayerDetails", {
      layerId,
      subLayerIndex: subLayerIndex,
    });
  };

  // Render method for legend icon
  const getIconFromLayer = () => {
    if (subLayerInfo.legendIcon) {
      return <LegendIcon url={subLayerInfo.legendIcon} />;
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
          sx={{ p: 0.25, mr: "5px" }}
          size="small"
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

  if (!subLayerInfo) {
    return null;
  }
  return (
    <div style={{ marginLeft: "7px" }}>
      <ListItemButton
        disableTouchRipple
        onClick={() => (toggleable ? toggleSubLayer(subLayer, visible) : null)}
        sx={{
          pl: "calc(2px + 10px)",
          borderBottom: (theme) =>
            toggleable
              ? `${theme.spacing(0.2)} solid ${theme.palette.divider}`
              : "none",
        }}
        dense
      >
        {toggleable && (
          <IconButton disableTouchRipple size="small">
            {getLayerToggleIcon()}
          </IconButton>
        )}
        {getIconFromLayer()}
        <ListItemText
          primary={subLayerInfo.caption}
          primaryTypographyProps={{
            pr: 5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: visible ? (toggleable ? "bold" : "inherit") : "inherit",
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
          <IconButton
            size="small"
            onClick={(e) => showLayerDetails(e)}
            sx={{
              "&:hover .ls-arrow": {
                transform: "translateX(3px)",
              },
            }}
          >
            <KeyboardArrowRightOutlinedIcon
              className="ls-arrow"
              sx={{
                transition: "transform 300ms ease",
                color: (theme) => theme.palette.grey[500],
              }}
            ></KeyboardArrowRightOutlinedIcon>
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
      {subLayerInfo.legendIcon ? null : (
        <Box sx={{ pl: 0, ml: "-1px" }}>
          <LegendImage
            src={subLayerInfo.legend}
            open={legendIsActive}
          ></LegendImage>
        </Box>
      )}
    </div>
  );
}
