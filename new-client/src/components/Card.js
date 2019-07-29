import React from "react";
import { withStyles } from "@material-ui/core/styles";
import {
  Card as MUICard,
  CardHeader,
  CardActionArea,
  Avatar
} from "@material-ui/core";

const styles = theme => {
  return {
    avatar: {
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText
    },
    card: {
      marginBottom: "10px",
      [theme.breakpoints.down("xs")]: {
        boxShadow: "none",
        borderBottom: "1px solid #ccc",
        borderRadius: 0,
        margin: 0,
        width: "100%",
        justifyContent: "left"
      }
    }
  };
};

class Card extends React.PureComponent {
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
      <MUICard onClick={onClick} className={classes.card}>
        <CardActionArea>
          <CardHeader
            avatar={<Avatar className={classes.avatar}>{icon}</Avatar>}
            title={title}
            subheader={abstract}
          />
        </CardActionArea>
      </MUICard>
    );
  }
}

export default withStyles(styles)(Card);
