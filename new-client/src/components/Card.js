import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";

const styles = theme => {
  return {
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
      whiteSpace: "normal",
      boxShadow:
        "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
      "&:hover": {
        background: "#e9e9e9"
      },
      [theme.breakpoints.down("xs")]: {
        boxShadow: "none",
        borderBottom: "1px solid #ccc",
        borderRadius: 0,
        margin: 0,
        width: "100%",
        justifyContent: "left"
      }
    },
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
    title: {
      fontSize: "10pt",
      fontWeight: "bold",
      marginBottom: "5px"
    }
  };
};

class Card extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      text: ""
    };
  }

  render() {
    const { classes, title, abstract, icon, onClick } = this.props;
    return (
      <div className={classes.card} onClick={onClick}>
        <div>
          <IconButton className={classes.button}>{icon}</IconButton>
        </div>
        <div>
          <Typography className={classes.title}>{title}</Typography>
          <Typography>{abstract}</Typography>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(Card);
