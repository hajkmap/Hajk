import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";

import InfoIcon from "@material-ui/icons/Info";
import Card from "../../components/Card.js";
import {
  Hidden,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@material-ui/core";

import Dialog from "../../components/Dialog.js";

const styles = theme => {
  return {};
};

class Information extends React.PureComponent {
  constructor(props) {
    super(props);
    this.type = "Information"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.options = props.options;
    this.title = this.options.title || "Om kartan";
    this.abstract = this.options.abstract || "Visa mer information";
    this.state = {
      dialogOpen: false
    };
  }

  componentDidMount() {
    let dialogOpen = this.options.visibleAtStart;

    if (this.options.visibleAtStart === true) {
      if (
        this.options.showInfoOnce === true &&
        parseInt(
          window.localStorage.getItem("pluginInformationMessageShown")
        ) === 1
      ) {
        dialogOpen = false;
      } else {
        if (this.options.showInfoOnce === true) {
          window.localStorage.setItem("pluginInformationMessageShown", 1);
        }
        dialogOpen = true;
      }
    } else {
      dialogOpen = false;
    }

    this.setState({
      dialogOpen: dialogOpen
    });
  }

  onClose = () => {
    this.setState({
      dialogOpen: false
    });
  };

  onClick = () => {
    this.setState({
      dialogOpen: true
    });
  };

  renderDialog() {
    return (
      <>
        <Dialog
          options={this.props.options}
          open={this.state.dialogOpen}
          onClose={this.onClose}
        />
        {this.renderDrawerButton()}
        {this.props.options.target === "left" &&
          this.renderWidgetButton("left-column")}
        {this.props.options.target === "right" &&
          this.renderWidgetButton("right-column")}
      </>
    );
  }

  renderDrawerButton() {
    return createPortal(
      <Hidden mdUp={this.props.options.target !== "toolbar"}>
        <ListItem
          button
          divider={true}
          selected={this.state.windowVisible}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
      </Hidden>,
      document.getElementById("plugin-buttons")
    );
  }

  renderWidgetButton(id) {
    return createPortal(
      // Hide Widget button on small screens, see renderDrawerButton too
      <Hidden smDown>
        <Card
          icon={<InfoIcon />}
          onClick={this.onClick}
          title={this.title}
          abstract={this.abstract}
        />
      </Hidden>,
      document.getElementById(id)
    );
  }

  render() {
    return this.renderDialog();
  }
}

export default withStyles(styles)(Information);
