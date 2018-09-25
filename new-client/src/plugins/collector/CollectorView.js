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
      bottom: '50%',
      width: '360px',
      marginLeft: '-180px',
      border: '1px solid #ccc',
      boxShadow: '3px 4px 5px rgba(0, 0, 0, 0.5)',
      borderRadius: '10px',
      zIndex: 1200,
      background: 'white',
      padding: '20px',
      [theme.breakpoints.down('xs')]: {
        left: '10px',
        right: '10px',
        marginLeft: 'auto',
        width: 'auto'
      }
    },
    right: {
      float: 'right'
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
        <CollectorForm model={this.model} onClose={this.onClose}/>
      </div>
    );
  }
}

export default withStyles(styles)(CollectorView);