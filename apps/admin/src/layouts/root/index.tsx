import React from "react";
import { Paper, styled } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Navbar from "./components/navbar";

const SIDEBAR_WIDTH = 250;

const Main = styled("main")(({ theme }) => ({
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

export default function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarPermanent, setSidebarPermanent] = React.useState(false);

  const toggleSidebar =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (sidebarPermanent) {
        return;
      }
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setSidebarOpen(open);
    };

  const toggleSidebarPermanent = () => {
    if (!sidebarPermanent) {
      setSidebarOpen(false);
    }
    setSidebarPermanent((p) => !p);
  };

  return (
    <Paper
      sx={{
        width: "100%",
        backgroundColor: (theme) => theme.palette.background.default,
        backgroundImage: "unset",
        minHeight: "100vh",
      }}
      square
    >
      <Navbar openSidebar={toggleSidebar(true)} />
      <Sidebar
        width={SIDEBAR_WIDTH}
        permanent={sidebarPermanent}
        open={sidebarOpen}
        close={toggleSidebar(false)}
        togglePermanent={toggleSidebarPermanent}
      />
      <Main
        sx={{
          ml: sidebarPermanent ? `${SIDEBAR_WIDTH}px` : 0,
        }}
      >
        <Outlet />
      </Main>
    </Paper>
  );
}
