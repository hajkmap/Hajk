import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Link,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkIcon from "@mui/icons-material/Link";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HajkToolTip from "components/HajkToolTip";
import LsIconButton from "./LsIconButton";

function GroupDetails({ display, groupDetails, app }) {
  // Because of a warning in dev console, we need special handling of tooltip for backbutton.
  // When a user clicks back, the tooltip of the button needs to be closed before this view hides.
  // TODO: Needs a better way to handle this
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Handles click on back button in header
  const handleBackButtonClick = () => {
    setTooltipOpen(false);
    setTimeout(() => {
      app.globalObserver.publish("setLayerDetails", null);
    }, 100);
  };

  // Handles backbutton tooltip close event
  const handleClose = () => {
    setTooltipOpen(false);
  };

  // Handles backbutton tooltip open event
  const handleOpen = () => {
    setTooltipOpen(true);
  };

  return (
    <>
      {groupDetails && display && (
        <Box
          sx={(theme) => ({
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#fff",
            position: "relative",
            overflowY: "auto",
            height: "inherit",
            minHeight: "15em",
            maxHeight: "inherit",
            ...theme.applyStyles("dark", {
              backgroundColor: "rgb(18,18,18)",
            }),
          })}
        >
          <Box
            sx={(theme) => ({
              p: 1,
              backgroundColor: theme.palette.grey[100],
              borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
              ...theme.applyStyles("dark", {
                backgroundColor: "#373737",
              }),
            })}
          >
            <Stack direction="row" alignItems="center">
              <HajkToolTip
                open={tooltipOpen}
                onClose={handleClose}
                onOpen={handleOpen}
                title="Tillbaka"
                TransitionProps={{ timeout: 0 }}
              >
                <LsIconButton onClick={handleBackButtonClick}>
                  <ArrowBackIcon />
                </LsIconButton>
              </HajkToolTip>
              <Box sx={{ flexGrow: 1, textAlign: "center" }}>
                <Typography variant="subtitle1">
                  {groupDetails.infogroupname}
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Box
            sx={{
              p: 1,
            }}
          >
            <Typography style={{ marginBottom: "4px" }}>
              {groupDetails.infogrouptitle}
            </Typography>
            <Typography variant="body2">
              {groupDetails.infogrouptext}
            </Typography>
            <List>
              {groupDetails.infogroupurl && (
                <ListItem>
                  <ListItemIcon>
                    <LinkIcon />
                  </ListItemIcon>
                  <Link href={groupDetails.infogroupurl} color="inherit">
                    {groupDetails.infogroupurltext}
                  </Link>
                </ListItem>
              )}
              {groupDetails.infogroupopendatalink && (
                <ListItem>
                  <ListItemIcon>
                    <LinkIcon />
                  </ListItemIcon>
                  <Link
                    href={groupDetails.infogroupopendatalink}
                    color="inherit"
                  >
                    Öppna data
                  </Link>
                </ListItem>
              )}
              {groupDetails.infogroupowner && (
                <ListItem>
                  <ListItemIcon>
                    <VerifiedUserIcon />
                  </ListItemIcon>
                  <ListItemText primary={groupDetails.infogroupowner} />
                </ListItem>
              )}
            </List>
          </Box>
        </Box>
      )}
    </>
  );
}

export default GroupDetails;
