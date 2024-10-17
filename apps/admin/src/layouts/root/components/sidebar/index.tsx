import { Paper, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LockButton from "./lock-button";
import {
  HEADER_HEIGHT,
  SIDEBAR_MINI_WIDTH,
  SIDEBAR_WIDTH,
  SIDEBAR_Z_INDEX,
} from "../../constants";
import SquareIconButton from "./square-icon-button";
import NavList from "./nav-list";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  locked: boolean;
  toggleLocked: () => void;
}

const Sidebar = (props: Props) => {
  const { palette } = useTheme();
  return (
    <Paper
      component="aside"
      elevation={1}
      sx={{
        position: "fixed",
        top: `${HEADER_HEIGHT}px`,
        left: props.open ? 0 : `-${SIDEBAR_WIDTH}px`,
        width: `${SIDEBAR_WIDTH}px`,
        backgroundColor:
          palette.mode === "light" ? palette.background.default : "",
        minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        zIndex: SIDEBAR_Z_INDEX,
        transition: "left 250ms ease",
      }}
      square
    >
      {/* Collapsed sidebar */}
      <Paper
        sx={{
          position: "absolute",
          top: "0px",
          right: props.open ? 0 : `-${SIDEBAR_MINI_WIDTH}px`,
          opacity: props.open ? 0.001 : 1.0,
          borderLeft: "0px solid transparent",
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          backgroundColor:
            palette.mode === "light" ? palette.background.default : "",
          transition: "right 250ms ease, opacity 200ms ease",
        }}
        square
      >
        <SquareIconButton onClick={() => props.setOpen(!props.open)}>
          <MenuIcon fontSize="large" />
        </SquareIconButton>
        <LockButton
          toggleLocked={props.toggleLocked}
          locked={props.locked}
          sx={{
            position: "absolute",
            bottom: "0px",
            right: "0px",
          }}
        />
      </Paper>
      {/* Full size sidebar */}
      <NavList
        setSidebarOpen={props.setOpen}
        locked={props.locked}
        toggleLocked={props.toggleLocked}
      />
    </Paper>
  );
};

export default Sidebar;
