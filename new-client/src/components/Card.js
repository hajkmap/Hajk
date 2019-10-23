import React from "react";
import propTypes from "prop-types";
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
      marginBottom: theme.spacing(1),
      width: "210px",
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
  state = {
    open: false,
    text: ""
  };

  static propTypes = {
    abstract: propTypes.string.isRequired,
    classes: propTypes.object.isRequired,
    icon: propTypes.object.isRequired,
    onClick: propTypes.func.isRequired,
    title: propTypes.string.isRequired
  };

  static defaultProps = {
    abstract: "Beskrivning saknas",
    title: "Titel saknas"
  };

  render() {
    const { abstract, classes, icon, onClick, title } = this.props;

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
