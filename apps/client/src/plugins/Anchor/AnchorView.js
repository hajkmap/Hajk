import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import QRCode from "qrcode";
import HajkToolTip from "components/HajkToolTip";

import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Paper,
  Switch,
} from "@mui/material";

import FileCopyIcon from "@mui/icons-material/FileCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& input": {
    fontFamily: "monospace",
  },
}));

const AnchorView = ({
  closeSnackbar,
  enqueueSnackbar,
  globalObserver,
  model,
  options,
  enableAppStateInHash,
}) => {
  const [anchor, setAnchor] = useState("");
  const [cleanUrl, setCleanUrl] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const handleMapUpdate = async ({ url }) => {
      const data = await generateQr(url);
      setAnchor(appendCleanModeIfActive(url));
      setQrCode(data);
    };

    globalObserver.subscribe("core.mapUpdated", handleMapUpdate);

    const initializeAnchor = async () => {
      const a = await model.getAnchor();
      setAnchor(a);
    };

    initializeAnchor();

    return () => {
      globalObserver.unsubscribe("core.mapUpdated", handleMapUpdate);
    };
  });

  const generateQr = (url) => {
    return QRCode.toDataURL(appendCleanModeIfActive(url));
  };

  const toggleShowQr = () => {
    setShowQr(!showQr);
  };

  const appendCleanModeIfActive = (url) => {
    return cleanUrl ? `${url}&clean` : url;
  };

  const toggleCleanUrl = async () => {
    const newCleanState = !cleanUrl;
    setCleanUrl(newCleanState);
    const newUrl = await model.getAnchor();
    setAnchor(appendCleanModeIfActive(newUrl));
  };

  const handleClickOnCopyToClipboard = () => {
    const input = document.getElementById("anchorUrl");
    input.select();
    document.execCommand("copy") &&
      enqueueSnackbar("Kopiering till urklipp lyckades!", {
        variant: "info",
      });
  };

  const allowCreatingCleanUrls = options.allowCreatingCleanUrls ?? true;

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Grid container spacing={2} columns={12}>
        <Grid item xs={12}>
          <Typography>
            Skapa en länk med kartans synliga lager, aktuella zoomnivå och
            utbredning.
          </Typography>
        </Grid>
      </Grid>
      {allowCreatingCleanUrls && (
        <Box sx={{ ml: { xs: 0, sm: 3 } }}>
          <Grid container spacing={2} columns={12}>
            <Grid item xs={12}>
              <RadioGroup
                aria-label="copy-url"
                name="copy-url"
                onChange={toggleCleanUrl}
              >
                <FormControlLabel
                  checked={!cleanUrl}
                  value="default"
                  control={<Radio color="primary" />}
                  label="Skapa länk till karta"
                />
                <FormControlLabel
                  checked={cleanUrl}
                  value="clean"
                  control={<Radio color="primary" />}
                  label="Skapa länk till karta utan verktyg etc."
                />
              </RadioGroup>
            </Grid>
          </Grid>
        </Box>
      )}
      <Box sx={{ ml: { xs: 0, sm: 7 }, mr: { xs: 0, sm: 7 } }}>
        <Grid container spacing={2} columns={12}>
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              id="anchorUrl"
              InputProps={{
                readOnly: true,
              }}
              value={anchor}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
      {document.queryCommandSupported("copy") && (
        <Box sx={{ ml: { xs: 0, sm: 7 }, mr: { xs: 0, sm: 7 } }}>
          <Grid container spacing={2} columns={12}>
            <Grid item xs={6}>
              <HajkToolTip title="Kopiera länk till urklipp">
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  component="a"
                  endIcon={<FileCopyIcon />}
                  onClick={handleClickOnCopyToClipboard}
                >
                  Kopiera länk
                </Button>
              </HajkToolTip>
            </Grid>
            <Grid item xs={6}>
              <HajkToolTip title="Öppna länk i nytt fönster">
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  endIcon={<OpenInNewIcon />}
                  href={anchor}
                  target="_blank"
                >
                  Öppna länk
                </Button>
              </HajkToolTip>
            </Grid>
          </Grid>
        </Box>
      )}
      {enableAppStateInHash && (
        <Box
          sx={{
            ml: { xs: 0, sm: 7 },
            mr: { xs: 0, sm: 7 },
            mt: 2,
          }}
        >
          <Grid container spacing={2} columns={12}>
            <Grid item xs={12}>
              <Paper sx={{ p: 1, mb: 2 }}>
                <Grid
                  container
                  columns={12}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Grid item xs={6}>
                    Slå på QR-kod
                  </Grid>
                  <Grid item xs={6} textAlign="end">
                    <HajkToolTip title="Slå på QR-kod">
                      <Switch
                        variant="contained"
                        color="primary"
                        onClick={toggleShowQr}
                      ></Switch>
                    </HajkToolTip>
                  </Grid>
                  {showQr && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          ml: { xs: 0, sm: 7 },
                          mr: { xs: 0, sm: 7 },
                        }}
                        textAlign={"center"}
                      >
                        <img src={qrCode} alt="" style={{ width: "250px" }} />
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

AnchorView.propTypes = {
  closeSnackbar: PropTypes.func.isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
  globalObserver: PropTypes.object.isRequired,
  model: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
  enableAppStateInHash: PropTypes.bool.isRequired,
};

export default withSnackbar(AnchorView);
