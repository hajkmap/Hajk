import React, { useState } from "react";

import {
  Box,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

import LegendIcon from "./LegendIcon";
import LegendImage from "./LegendImage";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ShowDetailsIcon from "@mui/icons-material/MoreOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import HajkToolTip from "components/HajkToolTip";
import LsIconButton from "@mui/material/IconButton"; // Updated import

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
      <HajkToolTip
        placement="left"
        title={
          legendIsActive ? "Dölj teckenförklaring" : "Visa teckenförklaring"
        }
      >
        <LsIconButton // Updated component
          sx={{ p: 0.25, mr: "5px" }}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setLegendIsActive(!legendIsActive);
          }}
        >
          <FormatListBulletedOutlinedIcon fontSize="small" />
        </LsIconButton>
      </HajkToolTip>
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
          <LsIconButton // Updated component
            disableTouchRipple
            size="small"
          >
            {getLayerToggleIcon()}
          </LsIconButton>
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
          className="FIND-SUBLAYERITEM-SECONDARY-ACTION"
          sx={{
            position: "absolute",
            right: "4px",
            top: "1px",
            transform: "none",
          }}
        >
          <LsIconButton
            size="small"
            onClick={(e) => showLayerDetails(e)}
            sx={{
              marginTop: "3px",
              "&:hover .ls-arrow": {
                color: "#fff",
              },
            }}
          >
            <ShowDetailsIcon
              className="ls-arrow"
              sx={{
                width: "0.7em",
                height: "0.7em",
                transform: "rotate(180deg)",
                color: (theme) => theme.palette.grey[500],
              }}
            ></ShowDetailsIcon>
          </LsIconButton>
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
