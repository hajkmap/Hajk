import React from "react";
import PropTypes from "prop-types";

import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

import {
  Box,
  Button,
  ButtonGroup,
  FormControlLabel,
  FormGroup,
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
    width: "100%",
    minWidth: 380,
    display: "flex",
  },
  buttons: {
    width: 380,
  },
  button: {
    width: 180,
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
      <>
        <Box>
          <FormGroup row>
            <Typography>
              Skapa en länk med kartans synliga lager, aktuella zoomnivå och
              utbredning.
            </Typography>
          </FormGroup>
        </Box>
        <Box ml={3} pt={1}>
          <FormGroup row>
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
          </FormGroup>
        </Box>
        <Box ml={7} mr={7} pt={2}>
          <FormGroup row>
            <TextField
              className={classes.input}
              fullWidth={false}
              id="anchorUrl"
              InputProps={{
                readOnly: true,
              }}
              value={this.state.anchor}
              variant="outlined"
              size="small"
            />
          </FormGroup>
        </Box>
        {document.queryCommandSupported("copy") && (
          <Box ml={7} mr={7} pt={2}>
            <ButtonGroup row className={classes.buttons}>
              <Tooltip title="Kopiera länk till urklipp">
                <Button
                  style={{ marginRight: 10 }}
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  endIcon={<FileCopyIcon />}
                  onClick={this.handleClickOnCopyToClipboard}
                >
                  Kopiera länk
                </Button>
              </Tooltip>
              <Tooltip title="Öppna länk i nytt fönster">
                <Button
                  style={{ marginLeft: 10 }}
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  endIcon={<OpenInNewIcon />}
                  href={this.state.anchor}
                  target="_blank"
                >
                  Öppna länk
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Box>
        )}
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(AnchorView));
