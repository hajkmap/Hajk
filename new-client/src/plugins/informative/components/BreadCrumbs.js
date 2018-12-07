import React from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  breadCrumContainer: {
    display: "inline-block",
    padding: "3px",
    cursor: "pointer"
  },
  breadCrum: {
    color: theme.palette.primary.main
  },
  last: {
    color: "black",
    cursor: "pointer"
  }
});

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
            chapter: c
          }
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
      chapter: "home"
    });
    return crums.reverse();
  }

  onCrumClick = chapter => event => {
    this.props.observer.publish("changeChapter", chapter);
  };

  renderCrums() {
    const { classes } = this.props;
    var crums = this.generate(this.props.chapter);
    if (crums.length === 1) {
      return null;
    }
    return crums.map((crum, i) => {
      let last = i === crums.length - 1;
      return (
        <div
          key={i}
          onClick={this.onCrumClick(crum.chapter)}
          className={classes.breadCrumContainer}
        >
          <span className={!last ? classes.breadCrum : classes.last}>
            {crum.text}
          </span>
          &nbsp;
          <span>{crum.text && !last ? ">" : ""}</span>
        </div>
      );
    });
  }

  render() {
    return <div>{this.renderCrums()}</div>;
  }
}

export default withStyles(styles)(BreadCrumbs);
