import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import QRCode from "qrcode";
import HajkToolTip from "components/HajkToolTip";
import ShareIcon from "@mui/icons-material/Share";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";

import {
  Button,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Box,
  Paper,
} from "@mui/material";

import FileCopyIcon from "@mui/icons-material/FileCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& input": {
    fontFamily: "monospace",
  },
}));

// Add styled Alert component
const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1),
  "& .MuiAlert-message": {
    padding: 0,
  },
}));

// Hide icons on small screens
const ResponsiveIcon = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

const AnchorView = (props) => {
  const { globalObserver, model, options, enableAppStateInHash } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const [anchor, setAnchor] = useState("");
  const [cleanUrl, setCleanUrl] = useState(false);
  const [qrCode, setQrCode] = useState(null);

  // Keep a mirror of cleanUrl so the mapUpdated subscription
  // (which is registered only once) always reads the current value.
  // Maintained by toggleCleanUrl, do not write to it during render.
  const cleanUrlRef = useRef(false);

  // Clipboard API is only available in secure contexts.
  const canCopyToClipboard =
    typeof navigator.clipboard?.writeText === "function";

  const appendCleanModeIfActive = useCallback(
    (url) => (cleanUrlRef.current ? `${url}&clean` : url),
    []
  );

  const generateQr = useCallback(
    (url) => QRCode.toDataURL(appendCleanModeIfActive(url)),
    [appendCleanModeIfActive]
  );

  useEffect(() => {
    // Subscribe to changes to anchor URL caused by other components. This ensures
    // that we have a live update of the anchor whether user does anything in the map.
    const mapUpdatedSubscription = globalObserver.subscribe(
      "core.mapUpdated",
      ({ url }) => {
        generateQr(url).then((data) => {
          setAnchor(appendCleanModeIfActive(url));
          setQrCode(data);
        });
      }
    );

    // Initiate the anchor-url on mount
    model.getAnchor().then(async (a) => {
      const qrData = await generateQr(a);
      setAnchor(a);
      setQrCode(qrData);
    });

    return () => {
      mapUpdatedSubscription?.unsubscribe();
    };
  }, [globalObserver, model, generateQr, appendCleanModeIfActive]);

  const toggleCleanUrl = async () => {
    const newCleanState = !cleanUrl;
    cleanUrlRef.current = newCleanState;
    setCleanUrl(newCleanState);
    const newUrl = await model.getAnchor();
    setAnchor(appendCleanModeIfActive(newUrl));
  };

  const handleClickOnCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(anchor);
      enqueueSnackbar(t("anchor.copySucceeded"), {
        variant: "info",
      });
    } catch {
      enqueueSnackbar(t("anchor.copyFailed"), {
        variant: "warning",
      });
    }
  };

  const allowCreatingCleanUrls = options.allowCreatingCleanUrls ?? true;
  const appStateInHashEnabled = enableAppStateInHash === true;

  return (
    <Grid container direction="column" sx={{ maxWidth: 400 }}>
      <Grid>
        <StyledAlert icon={<ShareIcon />} variant="info">
          {t("anchor.intro")}
        </StyledAlert>
      </Grid>
      {allowCreatingCleanUrls && (
        <Grid sx={{ mb: 1.5, display: { xs: "none", sm: "block" } }}>
          <RadioGroup
            aria-label={t("anchor.linkType")}
            name="copy-url"
            onChange={toggleCleanUrl}
          >
            <FormControlLabel
              checked={!cleanUrl}
              value="default"
              control={<Radio color="primary" />}
              label={t("anchor.linkToMap")}
            />
            <FormControlLabel
              checked={cleanUrl}
              value="clean"
              control={<Radio color="primary" />}
              label={t("anchor.linkToCleanMap")}
            />
          </RadioGroup>
        </Grid>
      )}
      <Grid sx={{ mb: 1, display: { xs: "none", sm: "block" } }}>
        <StyledTextField
          fullWidth={true}
          id="anchorUrl"
          slotProps={{ input: { readOnly: true } }}
          value={anchor}
          variant="outlined"
          size="small"
        />
      </Grid>
      <Grid sx={{ mb: 0 }}>
        <Grid container spacing={2}>
          {canCopyToClipboard && (
            <Grid size={6} sx={{ display: "flex" }}>
              <HajkToolTip title={t("anchor.copyLinkTooltip")}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  endIcon={
                    <ResponsiveIcon>
                      <FileCopyIcon />
                    </ResponsiveIcon>
                  }
                  sx={{
                    minHeight: { xs: "48px", sm: "36px" },
                    height: "auto",
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                    lineHeight: { xs: 1.2, sm: 1.75 },
                    textAlign: "center",
                  }}
                  onClick={handleClickOnCopyToClipboard}
                >
                  {t("anchor.copyLink")}
                </Button>
              </HajkToolTip>
            </Grid>
          )}
          <Grid size={canCopyToClipboard ? 6 : 12} sx={{ display: "flex" }}>
            <HajkToolTip title={t("anchor.openLinkTooltip")}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                endIcon={
                  <ResponsiveIcon>
                    <OpenInNewIcon />
                  </ResponsiveIcon>
                }
                href={anchor || null}
                target="_blank"
                sx={{
                  minHeight: { xs: "48px", sm: "36px" },
                  height: "auto",
                  whiteSpace: { xs: "normal", sm: "nowrap" },
                  lineHeight: { xs: 1.2, sm: 1.75 },
                  textAlign: "center",
                }}
              >
                {t("anchor.openLink")}
              </Button>
            </HajkToolTip>
          </Grid>
        </Grid>
      </Grid>
      {appStateInHashEnabled && (
        <Grid>
          <Paper sx={{ p: 1, mt: 2 }}>
            <Grid
              container
              sx={{
                justifyContent: "center",
              }}
            >
              <Grid size={12}>
                <Box
                  sx={{
                    minHeight: 200,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {qrCode && (
                    <img
                      src={qrCode}
                      alt={t("anchor.qrCode")}
                      style={{ minHeight: 200 }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

AnchorView.propTypes = {
  enableAppStateInHash: PropTypes.bool,
  globalObserver: PropTypes.object.isRequired,
  model: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
};

export default AnchorView;
