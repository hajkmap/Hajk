import React from "react";
import { IconButton, Paper } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

import useSnackbar from "../hooks/useSnackbar";

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
  // Import the clearAllMessages function from the useSnackbar hook.
  // This allows us to clear the Snackbar's state when the button is clicked.
  const { clearSnackbar } = useSnackbar();

  return (
    props.appModel.config.mapConfig.map.mapcleaner && (
      <HajkToolTip title="Dölj alla aktiva lager">
        <StyledPaper>
          <StyledIconButton
            aria-label="Rensa kartan"
            onClick={(e) => {
              props.appModel.clear();

              // Call the clearAllMessages function from the useCustomSnackbar hook.
              // This clears the state of messageItems in the Snackbar,
              // ensuring it stays in sync with the actual visibility of the layers.
              clearSnackbar();
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
