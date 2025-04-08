import React from "react";
import { IconButton, Paper } from "@mui/material";
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
 * @summary Displays the cookie notice dialog
 *
 * @param {object} props
 * @returns {object} React
 */
const CookieNoticeButton = React.memo((props) => {
  return (
    props.appModel.config.mapConfig.map.showCookieNoticeButton && (
      <HajkToolTip title="Visa cookie meddelande">
        <StyledPaper>
          <StyledIconButton
            aria-label="CookieNoticeButton"
            onClick={(e) => {
              props.appModel.globalObserver.publish("core.showCookieBanner");
            }}
          >
            <CookieIcon />
          </StyledIconButton>
        </StyledPaper>
      </HajkToolTip>
    )
  );
});

export default CookieNoticeButton;
