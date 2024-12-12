import { memo } from "react";
import { Box } from "@mui/material";
import SimpleBar, { Props } from "simplebar-react";
import { Theme, alpha, styled } from "@mui/material/styles";
import { SxProps } from "@mui/material";
import "simplebar-react/dist/simplebar.min.css";

interface ScrollbarProps extends Props {
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

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
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
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
    <Box
      component="div"
      sx={{ flexGrow: 1, height: "100%", overflow: "hidden" }}
    >
      <StyledScrollbar clickOnTrack={false} sx={sx} {...other}>
        {children}
      </StyledScrollbar>
    </Box>
  );
}

export default memo(Scrollbar);
