import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import Link from "@mui/material/Link";

const DivListItemContainer = styled("div")(({ theme }) => ({
  paddingLeft: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
}));

const DivListItem = styled("div")(() => ({
  display: "flex",
  justifyContent: "space-between",
}));

class LinkItem extends React.PureComponent {
  static propTypes = {
    link: PropTypes.object.isRequired,
  };

  render() {
    const { link } = this.props;

    return (
      <>
        <DivListItemContainer key={link.id}>
          <DivListItem>
            <Link
              href={link.link}
              target="_blank"
              rel="noreferrer"
            >{`${link.title}`}</Link>
          </DivListItem>
        </DivListItemContainer>
      </>
    );
  }
}
export default LinkItem;
