import { memo } from "react";
import { Box } from "@mui/material";
import { StyledRootScrollbar, StyledScrollbar } from "./styles";
import { ScrollbarProps } from "./types";

function Scrollbar({ children, sx, ...other }: ScrollbarProps) {
  const userAgent =
    typeof navigator === "undefined" ? "SSR" : navigator.userAgent;

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );

  if (isMobile) {
    return (
      <Box
        sx={{
          overflowX: "auto",
          ...(sx as Record<string, string | number | boolean>),
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <StyledRootScrollbar>
      <StyledScrollbar clickOnTrack={false} sx={sx} {...other}>
        {children}
      </StyledScrollbar>
    </StyledRootScrollbar>
  );
}

export default memo(Scrollbar);
