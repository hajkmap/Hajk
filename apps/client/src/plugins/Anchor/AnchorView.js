import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import withSnackbar from "components/WithSnackbar";
import QRCode from "qrcode";
import HajkToolTip from "components/HajkToolTip";
import ShareIcon from "@mui/icons-material/Share";
import Collapse from "@mui/material/Collapse";
import Alert from "@mui/material/Alert";

import {
  Button,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
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

// Add styled Alert component
const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1),
  "& .MuiAlert-message": {
    padding: 0,
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  minHeight: { xs: "48px", sm: "36px" },
  height: "auto",
  whiteSpace: { xs: "normal", sm: "nowrap" },
  lineHeight: { xs: 1.2, sm: 1.75 },
  textAlign: "center",
}));

// Hide icons on small screens
const ResponsiveIcon = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

class AnchorView extends React.PureComponent {
  static propTypes = {
    closeSnackbar: PropTypes.func.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    globalObserver: PropTypes.object.isRequired,
    model: PropTypes.object.isRequired,
  };

  state = {
    anchor: "",
    cleanUrl: false,
    qrCode: null,
    showQr: false,
  };

  async componentDidMount() {
    // Subscribe to changes to anchor URL caused by other components. This ensure
    // that we have a live update of the anchor whether user does anything in the map.
    this.props.globalObserver.subscribe("core.mapUpdated", ({ url }) => {
      this.generateQr(url).then((data) => {
        this.setState({
          anchor: this.appendCleanModeIfActive(url),
          qrCode: data,
        });
      });
    });

    // Initiate the anchor-url on mount
    const a = await this.props.model.getAnchor();
    const qrData = await this.generateQr(a);
    this.setState({
      anchor: a,
      qrCode: qrData,
    });
  }

  generateQr = (url) => {
    return QRCode.toDataURL(this.appendCleanModeIfActive(url));
  };

  toggleShowQr = () => {
    this.setState({ showQr: !this.state.showQr });
  };

  appendCleanModeIfActive = (url) =>
    this.state.cleanUrl ? (url += "&clean") : url;

  toggleCleanUrl = () => {
    const newCleanState = !this.state.cleanUrl;
    this.setState(
      {
        cleanUrl: newCleanState,
      },
      async () => {
        const newUrl = await this.props.model.getAnchor();
        this.setState({ anchor: this.appendCleanModeIfActive(newUrl) });
      }
    );
  };

  handleClickOnCopyToClipboard = (e) => {
    const input = document.getElementById("anchorUrl");
    input.select();
    document.execCommand("copy") &&
      this.props.enqueueSnackbar("Kopiering till urklipp lyckades!", {
        variant: "info",
      });
  };

  render() {
    const allowCreatingCleanUrls =
      this.props.options.allowCreatingCleanUrls ?? true;
    const appStateInHashEnabled = this.props.enableAppStateInHash === true;

    return (
      <Grid container direction="column" sx={{ maxWidth: 400 }}>
        <Grid item>
          <StyledAlert icon={<ShareIcon />} variant="info">
            Skapa en länk med kartans synliga lager, aktuella zoomnivå och
            utbredning.
          </StyledAlert>
        </Grid>
        {allowCreatingCleanUrls && (
          <Grid item sx={{ mb: 1.5 }}>
            <RadioGroup
              aria-label="copy-url"
              name="copy-url"
              onChange={this.toggleCleanUrl}
            >
              <FormControlLabel
                checked={!this.state.cleanUrl}
                value="default"
                control={<Radio color="primary" />}
                label="Skapa länk till karta"
              />
              <FormControlLabel
                checked={this.state.cleanUrl}
                value="clean"
                control={<Radio color="primary" />}
                label="Skapa länk till karta utan verktyg etc."
              />
            </RadioGroup>
          </Grid>
        )}
        <Grid item sx={{ mb: 1 }}>
          <StyledTextField
            fullWidth={true}
            id="anchorUrl"
            InputProps={{ readOnly: true }}
            value={this.state.anchor}
            variant="outlined"
            size="small"
          />
        </Grid>
        {document.queryCommandSupported("copy") && (
          <Grid item sx={{ mb: appStateInHashEnabled ? 2 : 0 }}>
            <Grid container spacing={2}>
              <Grid item size={6} sx={{ display: "flex" }}>
                <HajkToolTip title="Kopiera länk till urklipp">
                  <StyledButton
                    fullWidth
                    variant="contained"
                    color="primary"
                    component="a"
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
                    onClick={this.handleClickOnCopyToClipboard}
                  >
                    Kopiera länk
                  </StyledButton>
                </HajkToolTip>
              </Grid>
              <Grid item size={6} sx={{ display: "flex" }}>
                <HajkToolTip title="Öppna länk i nytt fönster">
                  <StyledButton
                    fullWidth
                    variant="contained"
                    color="primary"
                    endIcon={
                      <ResponsiveIcon>
                        <OpenInNewIcon />
                      </ResponsiveIcon>
                    }
                    href={this.state.anchor || null}
                    target="_blank"
                    sx={{
                      minHeight: { xs: "48px", sm: "36px" },
                      height: "auto",
                      whiteSpace: { xs: "normal", sm: "nowrap" },
                      lineHeight: { xs: 1.2, sm: 1.75 },
                      textAlign: "center",
                    }}
                  >
                    Öppna länk
                  </StyledButton>
                </HajkToolTip>
              </Grid>
            </Grid>
          </Grid>
        )}
        {appStateInHashEnabled && (
          <Grid item>
            <Paper sx={{ p: 1 }}>
              <Grid
                container
                alignItems="center"
                justifyContent="space-between"
              >
                <Grid item xs={6}>
                  Slå på QR-kod
                </Grid>
                <Grid item xs={6} style={{ textAlign: "end" }}>
                  <HajkToolTip title="Slå på QR-kod">
                    <Switch
                      variant="contained"
                      color="primary"
                      onClick={this.toggleShowQr}
                    />
                  </HajkToolTip>
                </Grid>
              </Grid>
              <Collapse in={this.state.showQr} unmountOnExit>
                <Grid container justifyContent="center">
                  <Grid item xs={12} style={{ textAlign: "center" }}>
                    <img
                      src={this.state.qrCode}
                      alt=""
                      style={{ minHeight: "200px" }}
                    />
                  </Grid>
                </Grid>
              </Collapse>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  }
}

export default withSnackbar(AnchorView);
