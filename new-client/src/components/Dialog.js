import React, { Component } from "react";
import propTypes from "prop-types";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

import ReactDialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

const StyledForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  width: 200,
}));

class Dialog extends Component {
  state = {
    open: false,
    text: "",
  };

  static propTypes = {
    onClose: propTypes.func.isRequired,
    open: propTypes.bool.isRequired,
    options: propTypes.object.isRequired,
  };

  /*
   * If the lifecycle of the component is not controlled by itself
   * the render method can be used to make the component
   * update its state when props changes.
   *
   * It is not recommended to mutate the state of this component
   * if the keys have the same name, it will duplicate the update event and
   * the last prop value will be taken.
   *
   * NOTE: this method is considered safer than using legacy componentWillRecieveProps.
   *
   * @param {object} props - new props
   * @param {object} state - current state
   * @return {object} state - updated state
   */
  static getDerivedStateFromProps(props, state) {
    return {
      open: props.open,
    };
  }

  handleChange = (name) => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleClose = (e) => {
    e.stopPropagation();
    this.props.onClose(this.state.text);
  };

  handleAbort = (e) => {
    e.stopPropagation();
    this.props.onAbort(this.state.text);
  };

  handleDialogClick = (e) => {
    e.stopPropagation();
    return false;
  };

  getHtml(text) {
    return {
      __html: text,
    };
  }

  renderDialogContent(text) {
    if (typeof text === "string") {
      return (
        <DialogContentText>
          <span dangerouslySetInnerHTML={this.getHtml(text)} />
        </DialogContentText>
      );
    } else {
      return text;
    }
  }

  renderPromptInput() {
    const { options } = this.props;
    if (!options.prompt) return null;

    return (
      <StyledForm
        noValidate
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          this.props.onClose(this.state.text);
          return false;
        }}
      >
        <StyledTextField
          id="prompt-text"
          label=""
          value={this.state.text}
          onChange={this.handleChange("text")}
          margin="normal"
          autoFocus={true}
        />
      </StyledForm>
    );
  }

  render() {
    const { options } = this.props;

    var text = "",
      header = "";

    if (options) {
      header = options.headerText;
      text = options.text;
    }

    var fullScreen = document.body.clientWidth < 600;

    return (
      <ReactDialog
        fullScreen={fullScreen}
        open={this.state.open}
        onClose={this.handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">{header}</DialogTitle>
        <DialogContent>
          {this.renderDialogContent(text)}
          {this.renderPromptInput()}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={this.handleClose}>
            {options.buttonText || "Stäng"}
          </Button>
          {options.abortText ? (
            <Button variant="contained" onClick={this.handleAbort}>
              {options.abortText}
            </Button>
          ) : null}
        </DialogActions>
      </ReactDialog>
    );
  }
}

export default Dialog;
