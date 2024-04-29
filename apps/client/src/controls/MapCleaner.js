import React from "react";
import { IconButton, Paper } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

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
      <HajkToolTip title="Dölj alla aktiva lager">
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
      </HajkToolTip>
    )
  );
});

export default MapCleaner;
