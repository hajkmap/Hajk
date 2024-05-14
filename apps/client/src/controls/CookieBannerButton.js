import React from "react";
import { IconButton, Paper } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CookieIcon from "@mui/icons-material/Cookie";

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
const CookieBannerButton = React.memo((props) => {
  return (
    <HajkToolTip title="Visa cookie banner">
      <StyledPaper>
        <StyledIconButton
          aria-label="Cookies"
          onClick={(e) => {
            this.globalObserver.publish("core.showCookieBanner");
          }}
        >
          <CookieIcon />
        </StyledIconButton>
      </StyledPaper>
    </HajkToolTip>
  );
});

export default CookieBannerButton;
