import React from "react";
import PropTypes from "prop-types";

import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";

import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import FileCopyIcon from "@mui/icons-material/FileCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& input": {
    fontFamily: "monospace",
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
  };

  componentDidMount() {
    // We check if anchor is a string, to avoid error in render() below.
    // This because the getAnchor() sometimes returns a Promise instead of a string.
    typeof anchor === "string" &&
      this.setState({ anchor: this.props.model.getAnchor() });

    // Subscribe to changes to anchor URL caused by other components. This ensure
    // that we have a live update of the anchor whether user does anything in the map.
    this.props.globalObserver.subscribe(
      "core.mapUpdated",
      ({ url, source }) => {
        this.setState({
          anchor: this.appendCleanModeIfActive(url),
        });
      }
    );
  }

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
    return (
      <Box sx={{ width: "100%" }}>
        <Grid container item spacing={2} columns={12}>
          <Grid item xs={12}>
            <Typography>
              Skapa en länk med kartans synliga lager, aktuella zoomnivå och
              utbredning.
            </Typography>
          </Grid>
        </Grid>
        {allowCreatingCleanUrls && (
          <Box sx={{ ml: { xs: 0, sm: 3 } }}>
            <Grid container item spacing={2} columns={12}>
              <Grid item xs={12}>
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
            </Grid>
          </Box>
        )}
        <Box sx={{ ml: { xs: 0, sm: 7 }, mr: { xs: 0, sm: 7 } }}>
          <Grid container item spacing={2} columns={12}>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth={true}
                id="anchorUrl"
                InputProps={{
                  readOnly: true,
                }}
                value={this.state.anchor}
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
                <Tooltip title="Kopiera länk till urklipp">
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    component="a"
                    endIcon={<FileCopyIcon />}
                    onClick={this.handleClickOnCopyToClipboard}
                  >
                    Kopiera länk
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title="Öppna länk i nytt fönster">
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    endIcon={<OpenInNewIcon />}
                    href={this.state.anchor}
                    target="_blank"
                  >
                    Öppna länk
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    );
  }
}

export default withSnackbar(AnchorView);
