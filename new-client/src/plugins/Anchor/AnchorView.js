import React from "react";
import PropTypes from "prop-types";

import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";

import {
  Checkbox,
  FormGroup,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import FileCopyIcon from "@mui/icons-material/FileCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const StyledFormGroup = styled(FormGroup)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledTextField = styled(TextField)(() => ({
  "& input": {
    fontFamily: "monospace",
  },
}));

class AnchorView extends React.PureComponent {
  static propTypes = {
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
    return (
      <>
        <StyledFormGroup row>
          <Typography>
            Skapa en länk med kartans synliga lager, aktuella zoomnivå och
            utbredning.
          </Typography>
        </StyledFormGroup>
        <StyledFormGroup row>
          <StyledTextField
            fullWidth
            id="anchorUrl"
            InputProps={{
              // display Copy to clipboard only if browser supports copy command
              endAdornment: document.queryCommandSupported("copy") && (
                <InputAdornment position="end">
                  <Tooltip disableInteractive title="Kopiera länk till urklipp">
                    <IconButton
                      onClick={this.handleClickOnCopyToClipboard}
                      size="large"
                    >
                      <FileCopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip disableInteractive title="Öppna i nytt fönster">
                    <IconButton
                      href={this.state.anchor}
                      target="_blank"
                      size="large"
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              readOnly: true,
            }}
            value={this.state.anchor}
            variant="outlined"
          />
        </StyledFormGroup>
        <StyledFormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={this.props.cleanUrl}
                onChange={this.props.toggleCleanUrl}
                value="clean"
              />
            }
            label="Valfritt: skapa länk till ren karta"
          />
        </StyledFormGroup>
      </>
    );
  }
}

export default withSnackbar(AnchorView);
