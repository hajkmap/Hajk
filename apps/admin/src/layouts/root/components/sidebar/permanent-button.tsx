"use client";

import { Box, IconButton, Tooltip } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useState } from "react";

interface Props {
  drawerPermanent: boolean;
  toggleDrawerPermanent: () => void;
}

export default function PermanentButton(props: Props) {
  const [drawerMouseOverLock, setDrawerMouseOverLock] = useState(false);

  const handleMouseEnter = () => {
    setDrawerMouseOverLock(true);
  };

  const handleMouseLeave = () => {
    setDrawerMouseOverLock(false);
  };

  return (
    <Box sx={{ l: "block", md: "none" }}>
      <Tooltip
        disableInteractive
        title={
          (props.drawerPermanent ? "Lås upp" : "Lås fast") + " sidopanelen"
        }
      >
        <IconButton
          sx={{ margin: "-12px", color: (theme) => theme.palette.text.primary }} // Ugh... However, it tightens everything up
          onClick={props.toggleDrawerPermanent}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          size="large"
        >
          {props.drawerPermanent ? (
            drawerMouseOverLock ? (
              <LockOpenIcon />
            ) : (
              <LockIcon />
            )
          ) : drawerMouseOverLock ? (
            <LockIcon />
          ) : (
            <LockOpenIcon />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
