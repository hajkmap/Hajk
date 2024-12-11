import { memo } from "react";
import { Box } from "@mui/material";
import { Props } from "simplebar-react";
import { Theme, alpha, styled } from "@mui/material/styles";
import { SxProps } from "@mui/material";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface ScrollbarProps extends Props {
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const StyledRootScrollbar = styled("div")(() => ({
  flexGrow: 1,
  height: "100%",
  overflow: "hidden",
}));

const StyledScrollbar = styled(SimpleBar)(({ theme }) => ({
  maxHeight: "100%",
  "& .simplebar-scrollbar": {
    "&:before": {
      backgroundColor: alpha(theme.palette.grey[600], 0.7),
    },
    "&.simplebar-visible:before": {
      opacity: 1,
    },
  },
  "& .simplebar-mask": {
    zIndex: "inherit",
  },
}));

function Scrollbar({ children, sx, ...other }: ScrollbarProps) {
  const testDevice =
    typeof navigator === "undefined" ? "SSR" : navigator.userAgent;

  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      testDevice
    );

  if (isMobileDevice) {
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
