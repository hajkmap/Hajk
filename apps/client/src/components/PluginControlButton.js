import React from "react";
import { IconButton, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledButton = styled(IconButton)(() => ({
  minWidth: "unset",
}));

export default function PluginControlButton({
  icon,
  onClick,
  title,
  abstract,
}) {
  return (
    <HajkToolTip title={`${title}: ${abstract}`}>
      <StyledPaper>
        <StyledButton aria-label={title} onClick={onClick}>
          {icon}
        </StyledButton>
      </StyledPaper>
    </HajkToolTip>
  );
}
