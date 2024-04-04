import React from "react";
import propTypes from "prop-types";
import { styled } from "@mui/material/styles";
import {
  Card as MUICard,
  CardHeader,
  CardActionArea,
  Avatar,
} from "@mui/material";

const StyledCard = styled(MUICard)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  width: "210px",
  [theme.breakpoints.down("sm")]: {
    boxShadow: "none",
    borderBottom: "1px solid #ccc",
    borderRadius: 0,
    margin: 0,
    width: "100%",
    justifyContent: "left",
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  background: theme.palette.text.primary,
}));

class Card extends React.PureComponent {
  state = {
    open: false,
    text: "",
  };

  static propTypes = {
    abstract: propTypes.string.isRequired,
    icon: propTypes.object.isRequired,
    onClick: propTypes.func.isRequired,
    title: propTypes.string.isRequired,
  };

  static defaultProps = {
    abstract: "Beskrivning saknas",
    title: "Titel saknas",
  };

  render() {
    const { abstract, icon, onClick, title } = this.props;

    return (
      <StyledCard onClick={onClick}>
        <CardActionArea>
          <CardHeader
            avatar={<StyledAvatar>{icon}</StyledAvatar>}
            title={title}
            subheader={abstract}
          />
        </CardActionArea>
      </StyledCard>
    );
  }
}

export default Card;
