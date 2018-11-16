import React from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  breadCrum: {
    color: "blue"
  }
});

class BreadCrumbs extends React.PureComponent {
  state = {};

  componentDidMount() {}

  generate(chapter) {
    var traverse = (c, crums) => {
      crums = [
        ...crums,
        {
          text: c.header,
          chapter: c
        }
      ];
      if (c.parent) {
        return traverse(c.parent, crums);
      }
      return crums;
    };
    var crums = traverse(chapter, []);
    return crums.reverse();
  }

  onCrumClick = chapter => event => {
    if (chapter && Array.isArray(chapter.chapters)) {
      this.props.observer.publish("changeChapter", chapter);
    }
  };

  renderCrums() {
    const { classes } = this.props;
    var crums = this.generate(this.props.chapter);
    return crums.map((crum, i) => {
      return (
        <span key={i} onClick={this.onCrumClick(crum.chapter)}>
          <span className={classes.breadCrum}>{crum.text}</span>{" "}
          {crum.text && i !== crums.length - 1 ? ">" : ""} &nbsp;
        </span>
      );
    });
  }

  render() {
    return <div>{this.renderCrums()}</div>;
  }
}

export default withStyles(styles)(BreadCrumbs);
