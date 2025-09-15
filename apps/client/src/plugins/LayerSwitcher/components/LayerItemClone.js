import React, { useEffect, useState, memo } from "react";

// Material UI components
import { Box, ListItemText, useTheme } from "@mui/material";

import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

// Custom components
import LegendIcon from "./LegendIcon";
import LegendImage from "./LegendImage";
import LsIconButton from "./LsIconButton";
import BtnShowLegend from "./BtnShowLegend";

import { getIsMobile } from "../LayerSwitcherUtils";

// const layerShouldShowLegendIcon = (layerType, isFakeMapLayer) =>
//   layerType === "group" ||
//   layerType === "base" ||
//   isFakeMapLayer ||
//   layerType === "system";

// const LayerLegendIcon = ({
//   legendIcon,
//   layerType,
//   legendIsActive,
//   toggleLegend,
// }) => {
//   const layerLegendIcon = legendIcon;
//   if (layerLegendIcon !== undefined) {
//     return <LegendIcon url={layerLegendIcon} />;
//   } else if (layerType === "system") {
//     return (
//       <BuildOutlinedIcon
//         sx={{
//           display: "block",
//           mr: "5px",
//           mt: "6px",
//           width: "18px",
//           height: "18px",
//         }}
//       />
//     );
//   }

//   return (
//     <BtnShowLegend
//       legendIsActive={legendIsActive}
//       onClick={() => toggleLegend()}
//     />
//   );
// };

function LayerItemClone({ layerConfig }) {
  // State that toggles legend collapse
  const theme = useTheme();

  const { layerCaption, layerType, layerInfo, layerLegendIcon } =
    layerConfig ?? {};

  return (
    <div className="layer-item">
      <Box
        sx={[
          {
            position: "relative",
            alignItems: "flex-start",
            display: "flex",
          },
        ]}
      >
        <Box
          sx={{
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "flex-start",
            py: getIsMobile() ? 0.5 : 0.25,
            pr: 1,
            pl: "2px",
          }}
        >
          {/* Draggable indicator icon */}
          <DragIndicatorOutlinedIcon
            sx={{ pt: "1px", mt: "7px" }}
            fontSize={"small"}
          />
          {/* System icon */}
          {layerType === "system" && (
            <BuildOutlinedIcon
              sx={{
                display: "block",
                mr: "5px",
                mt: "8px",
                width: "18px",
                height: "18px",
              }}
            ></BuildOutlinedIcon>
          )}
          {/* Group icon */}
          {layerType === "group" && (
            <KeyboardArrowRightOutlinedIcon
              sx={{
                mt: "4px",
              }}
              className="ls-arrow"
            ></KeyboardArrowRightOutlinedIcon>
          )}
          {/* Normal layer */}
          <FormatListBulletedIcon
            sx={{
              width: "20px",
              height: "20px",
              mt: "6px",
              mr: "8px",
            }}
          ></FormatListBulletedIcon>
          <ListItemText
            primary={layerCaption + " clone"}
            slotProps={{
              primary: {
                pr: 5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                variant: "body1",
              },
            }}
          />
        </Box>
      </Box>
    </div>
  );
}

export default memo(LayerItemClone);
