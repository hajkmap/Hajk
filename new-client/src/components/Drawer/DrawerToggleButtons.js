import React, { useEffect, useState } from "react";

import { styled } from "@mui/material/styles";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import CloseIcon from "@mui/icons-material/Close";
import { Paper, Hidden } from "@mui/material";
import { functionalOk as functionalCookieOk } from "models/Cookie";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginRight: theme.spacing(1),
  backgroundImage: "unset",
  [theme.breakpoints.down("sm")]: {
    boxShadow: "none",
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    border: "none",
  },
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    border: "none",
  },
  color:
    theme.palette.mode === "dark"
      ? theme.palette.common.white
      : theme.palette.action.active,
}));

function DrawerToggleButtons({
  drawerButtons,
  globalObserver,
  initialActiveButton,
  drawerStatic,
}) {
  //Set initial active button state based on the initially active drawer, received from App.js
  //This will either be a drawer button name such as "plugins" or null, depending on whether there
  //is an active drawer when the map starts (set either from the cookie or config).
  const [activeButton, setActiveButton] = useState(initialActiveButton);

  // Sort by the (optional) @order property prior rendering
  // Sort using minus (-) causes the correct behavior, as this will
  // first implicitly convert the value to number.
  // If we'd compare using less than (<), that would sort our values
  // as UTF-16 strings, so we could get something like: 1, 1000, 2,
  // instead of 1, 2, 1000 which is desired in this case.
  drawerButtons = drawerButtons.sort((a, b) => a?.order - b?.order);

  // Subscribe only once, important that it's done inside useEffect!
  useEffect(() => {
    globalObserver.subscribe("core.unsetActiveButton", () => {
      setActiveButton(null);
    });
  }, [globalObserver]);

  const handleClickOnToggleButton = (e, v) => {
    setActiveButton(v);

    if (v === null) {
      window.localStorage.removeItem("activeDrawerContent");
    } else {
      if (functionalCookieOk()) {
        window.localStorage.setItem("activeDrawerContent", v);
      }
    }

    // Let the outside world know that a button has been pressed.
    // App will handle changing context. v=null is valid too.
    globalObserver.publish("core.drawerContentChanged", v);
  };

  const renderToggleButton = ({
    ButtonIcon,
    value,
    caption,
    hideOnMdScreensAndAbove = false,
  }) => {
    // Currently active toggle button should have a "Close" icon
    const icon =
      value === activeButton && !drawerStatic ? (
        <CloseIcon sx={{ marginRight: { md: 1 } }} />
      ) : (
        <ButtonIcon sx={{ marginRight: { md: 1 } }} />
      );

    const disabled = drawerStatic && value === activeButton ? true : false;

    return (
      <StyledToggleButton
        id={value}
        key={value}
        value={value}
        sx={{
          // This sx rule is a special case, used by the
          // "Plugin Tools" drawer button. There are some
          // cases where we want to hide it on MD & up screens,
          // see #1020.
          ...(hideOnMdScreensAndAbove && {
            display: {
              md: "none",
            },
          }),
        }}
        disabled={disabled}
      >
        {icon}
        {/* Caption should be hidden on small screens*/}
        <Hidden mdDown>{caption}</Hidden>
      </StyledToggleButton>
    );
  };

  // Check if all buttons are hidden on md screens and above.
  const areAllButtonsHiddenOnMdAndAbove = drawerButtons.every(
    (b) => b.hideOnMdScreensAndAbove
  );

  return (
    drawerButtons.length > 0 &&
    !areAllButtonsHiddenOnMdAndAbove && (
      <StyledPaper>
        <StyledToggleButtonGroup
          value={activeButton}
          exclusive
          onChange={handleClickOnToggleButton}
          aria-label="Drawer content"
        >
          {drawerButtons.map((b) => renderToggleButton(b))}
        </StyledToggleButtonGroup>
      </StyledPaper>
    )
  );
}

function arePropsEqual(prevProps, nextProps) {
  // Only re-render if drawerButtons have changed since last render
  return prevProps.drawerButtons.length === nextProps.drawerButtons.length;
}

export default React.memo(DrawerToggleButtons, arePropsEqual);
