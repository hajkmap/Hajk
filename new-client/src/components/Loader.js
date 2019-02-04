import React from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => {
  return {
    loader: {
      display: "none"
    }
  };
};

class LoaderView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { classes } = this.props;
    return <div className={classes.loader}>Loader</div>;
  }
}

export default withStyles(styles)(LoaderView);
