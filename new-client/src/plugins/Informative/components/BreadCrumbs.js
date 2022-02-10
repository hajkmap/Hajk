import React from "react";
import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const DivBreadCrumContainer = styled("div")(({ theme }) => ({
  display: "inline-block",
  padding: "3px",
  cursor: "pointer",
}));

class BreadCrumbs extends React.PureComponent {
  state = {};

  componentDidMount() {}

  generate(chapter) {
    var traverse = (c, crums) => {
      if (c.header) {
        crums = [
          ...crums,
          {
            text: c.header,
            chapter: c,
          },
        ];
      }
      if (c.parent) {
        return traverse(c.parent, crums);
      }
      return crums;
    };
    var crums = traverse(chapter, []);
    crums.push({
      text: this.props.caption,
      chapter: "home",
    });
    return crums.reverse();
  }

  onCrumClick = (chapter) => (event) => {
    this.props.observer.publish("changeChapter", chapter);
  };

  renderCrums() {
    var crums = this.generate(this.props.chapter);
    if (crums.length === 1) {
      return null;
    }
    return crums.map((crum, i) => {
      let last = i === crums.length - 1;
      return (
        <DivBreadCrumContainer key={i} onClick={this.onCrumClick(crum.chapter)}>
          <Typography component={"span"} variant="caption">
            {crum.text}
          </Typography>
          &nbsp;
          <span>{crum.text && !last ? ">" : ""}</span>
        </DivBreadCrumContainer>
      );
    });
  }

  render() {
    return <div>{this.renderCrums()}</div>;
  }
}

export default BreadCrumbs;
