import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";

import Dialog from "../../components/Dialog.js";

const styles = theme => {
  return {
    button: {
      width: "50px",
      height: "50px",
      marginRight: "30px",
      outline: "none",
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      "&:hover": {
        background: theme.palette.primary.main
      }
    },
    card: {
      cursor: "pointer",
      width: "180px",
      borderRadius: "4px",
      background: "white",
      padding: "10px 20px",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      boxShadow:
        "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
      "&:hover": {
        background: "#e9e9e9"
      },
      [theme.breakpoints.down("xs")]: {
        width: "auto",
        justifyContent: "inherit"
      }
    },
    title: {
      fontSize: "10pt",
      fontWeight: "bold",
      marginBottom: "5px"
    },
    text: {}
  };
};

class Infomation extends Component {
  constructor(spec) {
    super(spec);
    this.text = "Infomation";
    this.state = {
      dialogOpen: false
    };
  }

  componentDidMount() {
    this.setState({
      dialogOpen: this.props.options.visibleAtStart
    });
  }

  onClose = () => {
    this.setState({
      dialogOpen: false
    });
  };

  onClick = () => {
    this.setState({
      dialogOpen: true
    });
  };

  renderDialog() {
    return createPortal(
      <Dialog
        options={this.props.options}
        open={this.state.dialogOpen}
        onClose={this.onClose}
      />,
      document.getElementById("map")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.card} onClick={this.onClick}>
          <div>
            <IconButton className={classes.button}>
              <InfoIcon />
            </IconButton>
          </div>
          <div>
            <Typography className={classes.title}>Information</Typography>
            <Typography className={classes.text}>
              Visa mer information
            </Typography>
          </div>
        </div>
        {this.renderDialog()}
      </>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem button divider={true} selected={false} onClick={this.onClick}>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary={this.text} />
        </ListItem>
        {this.renderDialog()}
      </div>
    );
  }

  render() {
    if (this.props.type === "toolbarItem") {
      return this.renderAsToolbarItem();
    }

    if (this.props.type === "widgetItem") {
      return this.renderAsWidgetItem();
    }

    return null;
  }
}

export default withStyles(styles)(Infomation);
