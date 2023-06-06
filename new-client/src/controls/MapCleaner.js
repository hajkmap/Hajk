import React from "react";
import { IconButton, Paper, Tooltip } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(() => ({
  minWidth: "unset",
}));

/**
 * @summary Hides all visible layers
 *
 * @param {object} props
 * @returns {object} React
 */
const MapCleaner = React.memo((props) => {
  const { t } = useTranslation();

  return (
    props.appModel.config.mapConfig.map.mapcleaner && (
      <Tooltip disableInteractive title={t("controls.mapCleaner.toolTip")}>
        <StyledPaper>
          <StyledIconButton
            aria-label={t("controls.mapCleaner.ariaLabel")}
            onClick={(e) => {
              props.appModel.clear();
            }}
          >
            <VisibilityOffIcon />
          </StyledIconButton>
        </StyledPaper>
      </Tooltip>
    )
  );
});

export default MapCleaner;
