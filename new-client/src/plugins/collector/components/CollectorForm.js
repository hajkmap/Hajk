import React, { Component } from "react";
import { createPortal } from "react-dom";
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from "@material-ui/core/styles";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Snackbar from '@material-ui/core/Snackbar';

const styles = theme => {
  return {
    text: {
      width: "100%"
    },
    form: {
    },
    cross: {
      position: "fixed",
      left: "50%",
      top: "50%",
      color: theme.palette.primary.main,
      textShadow: "2px 2px rgba(0, 0, 0, 0.5)",
      userSelect: "none",
      '& i': {
        fontSize: "50px",
        marginLeft: "-27px",
        marginTop: "9px"
      }
    },
    crossButton: {
      marginTop: '10px',
      marginLeft: '-31px'
    },
    saveError: {
      color: 'red',
      background: "rgb(255, 200, 200)",
      marginTop: '15px',
      borderRadius: '5px',
      padding: '5px'
    },
    padded: {
      padding: "20px 0"
    }
  }
};

const saveErrorText = "Fel - din kommentar gick inte att spara.";
const validationErrorText = " - detta fält krävs";

class CollectorForm extends Component {

  state = {
    comment: "",
    saveError: "",
    validationError: "",
    displayPlace: true
  };

  renderPlaceForm = () => {
    this.setState({
      mode: "place",
      displayPlace: true
    });
    this.props.closePanel();
  };

  renderGenericForm = () => {
    this.setState({
      mode: "generic",
      displayPlace: false
    });
  };

  renderSuccessForm = () => {
    this.setState({
      mode: "success"
    });
  };

  saveError = (text) => {
    this.setState({
      saveError: text || saveErrorText
    });
  };

  reset = () => {
    this.setState({
      comment: "",
      saveError: "",
      validationError: "",
      mode: "start"
    });
  };

  save = (generic) => () => {
    if (this.state.comment) {
      this.props.model.save(
        {
          comment: this.state.comment,
          displayPlace: this.state.displayPlace,
          generic: generic
        },
        (transactionResult) => {
          if (transactionResult &&
              transactionResult.transactionSummary &&
              transactionResult.transactionSummary.totalInserted) {
              if (transactionResult.transactionSummary.totalInserted > 0) {
                this.setState({
                  comment: "",
                  saveError: "",
                  validationError: "",
                  mode: "success"
                });
              } else {
                this.saveError();
              }
          } else {
            this.saveError();
          }
      }, (error) => {
        this.saveError(error);
      });
    } else {
      this.setState({
        validationError: validationErrorText
      });
    }
  };

  abort = () => {
    this.reset();
    this.props.onClose();
  };

  handleChange = (name) => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  renderSaveError() {
    const { classes } = this.props;
    return this.state.saveError
      ? <div className={classes.saveError}>{this.state.saveError}</div>
      : null
  }

  renderSuccess() {
    const { classes } = this.props;
    return (
      <div className={classes.form}>
        <h2>TACK för din synpunkt - den är viktigt för oss!</h2>
        <div>
          <Button color="primary" onClick={this.abort}>Stäng</Button>
        </div>
      </div>
    )
  }

  renderStart() {
    const { classes } = this.props;
    return (
      <div className={classes.form}>
        <div><h2>Vi vill veta vad du tycker!</h2></div>
        <div>Är din synpunkt:</div>
        <div>
          <div className={classes.padded}>
            <Button color="primary" variant="contained" onClick={this.renderPlaceForm}>Kopplad till en plats</Button>&nbsp;
            <Button color="primary" variant="contained" onClick={this.renderGenericForm}>Generell</Button>
          </div>
        </div>
      </div>
    )
  }

  renderGeneric() {
    const { classes } = this.props;
    return (
      <div className={classes.form}>
        <div>Skriv din synpunkt nedan: </div>
        <TextField
          rows="2"
          multiline={true}
          id="comment"
          label={"Din synpunkt" + this.state.validationError}
          value={this.state.comment}
          className={classes.text}
          onChange={this.handleChange('comment')}
          margin="normal"
        /><br/>
        <Button color="primary" variant="contained" onClick={this.save(true)}>Skicka</Button>
        <Button color="primary" onClick={this.abort}>Avbryt</Button>
        {this.renderSaveError()}
      </div>
    )
  }

  renderPlace() {
    const { classes } = this.props;
    return (
      <div className={classes.form}>
        {
          createPortal(
            <div className={classes.cross}>
              <i className="material-icons">place</i><br/>
              <Button
                className={classes.crossButton}
                variant="contained"
                color="primary"
                onClick={() => {
                  this.props.openPanel();
                }}>ok</Button>
              <Snackbar
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center'
                }}
                open={true}
                onClose={() => {}}
                ContentProps={{
                  'aria-describedby': 'message-id',
                }}
                message={<span id="message-id">Dra i kartan för att välja plats.</span>}
              />
            </div>,
          document.getElementById("map"))
        }
        <div>Skriv din synpunkt nedan: </div>
        <TextField
          rows="2"
          multiline={true}
          id="comment"
          label={"Din synpunkt" + this.state.validationError}
          value={this.state.comment}
          className={classes.text}
          onChange={this.handleChange('comment')}
          margin="normal"
        /><br/>
        <Button color="primary" variant="contained" onClick={this.save(false)}>Skicka</Button>&nbsp;
        <Button color="primary" onClick={this.abort}>Avbryt</Button>
        <br/>
        <FormControlLabel
          control={
            <Checkbox
              checked={this.state.displayPlace}
              onChange={() => {
                this.setState({
                  displayPlace: !this.state.displayPlace
                })
              }}
              value="displayPlace"
              color="primary"
            />
          }
          label="Jag vill visa min kommentar på kartan"
        />
        {this.renderSaveError()}
      </div>
    )
  }

  render() {
    switch (this.state.mode) {
      case "success":
        return this.renderSuccess()
      case "generic":
        return this.renderGeneric()
      case "place":
        return this.renderPlace()
      default:
        return this.renderStart()
    }
  }
}

export default withStyles(styles)(CollectorForm);