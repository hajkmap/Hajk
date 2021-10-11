import React from "react";
import { Button, Paper, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledButton = styled(Button)(() => ({
  minWidth: "unset",
}));

export default function PluginControlButton({
  icon,
  onClick,
  title,
  abstract,
}) {
  return (
    <Tooltip disableInteractive title={`${title}: ${abstract}`}>
      <StyledPaper>
        <StyledButton aria-label={title} onClick={onClick}>
          {icon}
        </StyledButton>
      </StyledPaper>
    </Tooltip>
  );
}
