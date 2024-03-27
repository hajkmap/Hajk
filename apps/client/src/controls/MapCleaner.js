import React from "react";
import { IconButton, Paper, Tooltip } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  minWidth: "unset",
}));

/**
 * @summary Hides all visible layers
 *
 * @param {object} props
 * @returns {object} React
 */
const MapCleaner = React.memo((props) => {
  return (
    props.appModel.config.mapConfig.map.mapcleaner && (
      <Tooltip disableInteractive title="Dölj alla aktiva lager">
        <StyledPaper>
          <StyledIconButton
            aria-label="Rensa kartan"
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
