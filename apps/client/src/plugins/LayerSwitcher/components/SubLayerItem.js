import React, { useState } from "react";

import {
  Box,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

import LegendIcon from "./LegendIcon";
import LegendImage from "./LegendImage";

import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import HajkToolTip from "components/HajkToolTip";
import LsIconButton from "./LsIconButton";
import BtnShowDetails from "./BtnShowDetails";
import LsCheckBox from "./LsCheckBox";

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
        <LsIconButton
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
          <LsCheckBox
            toggleState={
              visible
                ? zoomVisible
                  ? "checked"
                  : "checkedWithWarning"
                : "unchecked"
            }
          />
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
            paddingTop: "3px",
            transform: "none",
          }}
        >
          <BtnShowDetails onClick={(e) => showLayerDetails(e)} />
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
