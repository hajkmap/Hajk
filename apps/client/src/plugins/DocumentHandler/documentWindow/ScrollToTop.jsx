import { Box, Fab } from "@mui/material";
import NavigationIcon from "@mui/icons-material/Navigation";
import { darken } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";

const ScrollToTop = (props) => {
  return (
    <Fab
      size="small"
      onClick={props.onClick}
      sx={(theme) => ({
        position: "fixed",
        bottom: theme.spacing(2),
        right: theme.spacing(3),
        backgroundColor: "transparent",
        boxShadow: "none",
        "&:hover, &:focus-visible, &.Mui-focusVisible": {
          backgroundColor: "transparent",
          boxShadow: "none",
        },
        "&:active": {
          boxShadow: "none",
        },
      })}
    >
      <Box sx={visuallyHidden}>Scrolla till toppen av dokumentet</Box>
      {/* Inner box so opacity can fade the disk. The Fab stays
          transparent — MUI resets its background on hover/focus,
          so opacity on the Fab itself has no painted surface to fade. */}
      <Box
        sx={(theme) => {
          const backgroundColor = props.color || theme.palette.grey[300];
          return {
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            boxShadow: 6,
            opacity: 0.5,
            transition: "opacity 250ms, background-color 250ms",
            backgroundColor,
            ".MuiFab-root:hover &, .MuiFab-root:focus-visible &, .MuiFab-root.Mui-focusVisible &":
              {
                opacity: 1,
                backgroundColor: darken(backgroundColor, 0.3),
              },
          };
        }}
      >
        <NavigationIcon />
      </Box>
    </Fab>
  );
};
export default ScrollToTop;
