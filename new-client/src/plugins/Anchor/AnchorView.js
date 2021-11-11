import React from "react";
import PropTypes from "prop-types";

import { withStyles } from "@material-ui/core/styles";
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
} from "@material-ui/core";

import FileCopyIcon from "@material-ui/icons/FileCopy";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";

const styles = (theme) => ({
  input: {
    "& input": {
      fontFamily: "monospace",
    },
  },
  margin: {
    [theme.breakpoints.down("xs")]: {
      margin: 0,
    },
  },
});

class AnchorView extends React.PureComponent {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    cleanUrl: PropTypes.bool.isRequired,
    closeSnackbar: PropTypes.func.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    localObserver: PropTypes.object.isRequired,
    model: PropTypes.object.isRequired,
    toggleCleanUrl: PropTypes.func.isRequired,
  };

  state = {
    anchor: this.props.model.getAnchor(),
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
  }

  componentDidMount() {
    this.localObserver.subscribe("mapUpdated", (anchor) => {
      this.setState({
        anchor: anchor,
      });
    });
  }

  handleClickOnCopyToClipboard = (e) => {
    const input = document.getElementById("anchorUrl");
    input.select();
    document.execCommand("copy") &&
      this.props.enqueueSnackbar("Kopiering till urklipp lyckades!", {
        variant: "info",
      });
  };

  render() {
    const { classes } = this.props;
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
        <Box ml={3} className={classes.margin}>
          <Grid container item spacing={2} columns={12}>
            <Grid item xs={12}>
              <RadioGroup
                aria-label="copy-url"
                name="copy-url"
                onChange={this.props.toggleCleanUrl}
              >
                <FormControlLabel
                  checked={!this.props.cleanUrl}
                  value="default"
                  control={<Radio color="primary" />}
                  label="Skapa länk till karta"
                />
                <FormControlLabel
                  checked={this.props.cleanUrl}
                  value="clean"
                  control={<Radio color="primary" />}
                  label="Skapa länk till karta utan verktyg etc."
                />
              </RadioGroup>
            </Grid>
          </Grid>
        </Box>
        <Box ml={7} mr={7} className={classes.margin}>
          <Grid container item spacing={2} columns={12}>
            <Grid item xs={12}>
              <TextField
                className={classes.input}
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
          <Box ml={7} mr={7} className={classes.margin}>
            <Grid container spacing={2} columns={12}>
              <Grid item xs={6}>
                <Tooltip title="Kopiera länk till urklipp">
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
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

export default withStyles(styles)(withSnackbar(AnchorView));
