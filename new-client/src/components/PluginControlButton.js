import React from "react";
import { IconButton, Paper, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <Tooltip disableInteractive title={`${t(title)}: ${t(abstract)}`}>
      <StyledPaper>
        <StyledButton aria-label={t(title)} onClick={onClick}>
          {icon}
        </StyledButton>
      </StyledPaper>
    </Tooltip>
  );
}
