import React from "react";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import MoreVert from "@material-ui/icons/MoreVert";
import Window from "../../../../components/Window.js";
import SettingsMenu from "./SettingsMenu";

const styles = theme => ({
  root: {
    zIndex: 1
  }
});

class SearchSettingsButton extends React.Component {
  state = {
    open: false
  };

  handleClick = event => {
    this.setState({
      open: true
    });
  };

  close = e => {
    this.setState({ open: false });
  };

  renderWindow() {
    return (
      <Window
        globalObserver={null}
        title={"(NOT IMPLEMENTED!!"}
        onClose={this.close}
        open={this.state.open}
        height={400}
        width="400px"
        top={145}
        left={5}
        mode={""}
      >
        <SettingsMenu />
      </Window>
    );
  }

  render() {
    return (
      <div>
        <IconButton onClick={this.handleClick}>
          <MoreVert />
        </IconButton>
        {this.renderWindow()}
      </div>
    );
  }
}

export default withStyles(styles)(SearchSettingsButton);
