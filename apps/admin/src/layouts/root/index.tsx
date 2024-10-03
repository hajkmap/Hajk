import React from "react";
import { Box, Paper, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import {
  HEADER_HEIGHT,
  SIDEBAR_MINI_WIDTH,
  SIDEBAR_WIDTH,
  SIDEBAR_ZINDEX,
} from "./constants";

export default function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarPermanent, setSidebarPermanent] = React.useState(false);
  const theme = useTheme();

  const toggleSidebarPermanent = () => {
    setSidebarOpen(!sidebarPermanent);
    setSidebarPermanent(!sidebarPermanent);
  };

  const showOverlay = () => {
    return sidebarOpen && !sidebarPermanent;
  };

  return (
    <Paper
      sx={{
        width: "100%",
        backgroundColor: theme.palette.background.default,
        backgroundImage: "unset",
        minHeight: "100vh",
      }}
      square
    >
      <Header />
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        permanent={sidebarPermanent}
        togglePermanent={toggleSidebarPermanent}
      />
      <Box
        component="main"
        id="main"
        sx={{
          paddingTop: `${HEADER_HEIGHT}px`,
          marginLeft:
            sidebarOpen && sidebarPermanent
              ? `${SIDEBAR_WIDTH}px`
              : `${SIDEBAR_MINI_WIDTH}px`,
          minHeight: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          transition: "margin-left 250ms ease",
        }}
      >
        <Box
          onClick={(e) => {
            if (sidebarOpen && !sidebarPermanent) {
              setSidebarOpen(false);
              e.preventDefault();
            }
          }}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            opacity: showOverlay() ? 1.0 : 0.0,
            pointerEvents: showOverlay() ? "all" : "none",
            transition: "opacity 250ms ease",
            zIndex: SIDEBAR_ZINDEX - 1,
          }}
        ></Box>
        <Outlet />
      </Box>
    </Paper>
  );
}
