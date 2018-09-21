import React, { Component } from "react";
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from "@material-ui/core/styles";

const styles = theme => {
  return {
    text: {
      width: "100%"
    },
    cross: {
      position: "fixed",
      left: "50%",
      top: "50%",
      color: theme.palette.primary.main,
      textShadow: "2px 2px rgba(0, 0, 0, 0.5)",
      userSelect: "none",
      '& i': {
        fontSize: "41pt",
        marginLeft: "-21pt",
        marginTop: "9pt"
      }
    }
  }
};

class CollectorForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      comment: ""
    };
  }

  save = () => {
    this.props.model.save(this.state.comment);
    this.setState({
      comment: ""
    });
  };

  abort = () => {
    this.props.onClose();
  };

  handleChange = (name) => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  render() {
    const { classes } = this.props;
    return (
      <div>
        <div className={classes.cross}>
          <i className="material-icons">place</i>
        </div>
        <TextField
          rows="2"
          multiline={true}
          id="comment"
          label="Kommentar"
          value={this.state.comment}
          className={classes.text}
          onChange={this.handleChange('comment')}
          margin="normal"
        /><br/>
        <Button color="primary" variant="contained" onClick={this.save}>Spara</Button>
        <Button color="primary" onClick={this.abort}>Avbryt</Button>
      </div>
    )
  }
}

export default withStyles(styles)(CollectorForm);