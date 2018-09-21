import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import CollectorForm from "./components/CollectorForm.js";
import classNames from "classnames";
import "./style.css";

const styles = theme => {
  return {
    hidden: {
      display: 'none'
    },
    popup: {
      position: 'fixed',
      left: '50%',
      top: '50%',
      width: '300px',
      marginLeft: '-150px',
      marginTop: '-210px',
      border: '1px solid #ccc',
      boxShadow: '3px 4px 5px rgba(0, 0, 0, 0.5)',
      borderRadius: '10px',
      zIndex: 1200,
      background: 'white',
      padding: '20px'
    }
  }
};

class CollectorView extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.model = props.model;
  }

  componentDidMount() {
  }

  onClose = () => {
    this.props.onClose();
  };

  render() {
    const { classes } = this.props;
    var clsNames = this.props.dialogOpen
      ? classNames(classes.popup)
      : classNames(classes.popup, classes.hidden)
    return (
      <div className={clsNames}>
        <div>
          <div>Här kan du tycka till om en viss plats eller ett område.</div>
          <CollectorForm model={this.model} onClose={this.onClose}/>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(CollectorView);