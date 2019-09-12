import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withTheme } from "@material-ui/styles";
import {
  Hidden,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@material-ui/core";
import Window from "../components/Window.js";
import Card from "../components/Card.js";

const styles = theme => {
  return {};
};

class BaseWindowPlugin extends React.PureComponent {
  state = {
    windowVisible: false
  };

  constructor(props) {
    super(props);
    // There will be defaults in props.custom, so that each plugin has own default title/description
    this.title = props.options.title || props.custom.title;
    this.description = props.options.description || props.custom.description;

    this.width = props.custom.width || 400;
    this.height = props.custom.height || "auto";

    this.top = props.custom.top || props.theme.spacing(2);

    // Determine the left margin. If target=toolbar|right, set left margin
    // to almost 0. If target=left however, we don't want to display
    // the window on top of Widget button, so we place the window on the
    // right side of the screen.
    this.left =
      props.options.target === "left"
        ? (window.innerWidth - this.width) / 2
        : props.theme.spacing(2);

    props.app.registerWindowPlugin(this);
  }

  componentDidMount() {
    this.setState({
      windowVisible: this.props.options.visibleAtStart
    });
  }

  handleButtonClick = e => {
    this.props.app.onWindowOpen(this);
    this.setState(
      {
        windowVisible: true
      },
      () => {
        // If there's a callback defined in custom, run it
        typeof this.props.custom.onWindowShow === "function" &&
          this.props.custom.onWindowShow();
      }
    );
    this.props.app.globalObserver.publish("hideDrawer");
  };

  closeWindow = () => {
    this.setState(
      {
        windowVisible: false
      },
      () => {
        typeof this.props.custom.onWindowHide === "function" &&
          this.props.custom.onWindowHide();
      }
    );
  };

  renderWindow(mode = "window") {
    return (
      <>
        <Window
          globalObserver={this.props.app.globalObserver}
          title={this.title}
          onClose={this.closeWindow}
          open={this.state.windowVisible}
          onResize={this.props.custom.onResize}
          width={this.width}
          height={this.height}
          top={this.top}
          left={this.left}
          mode={mode}
        >
          {this.props.children}
        </Window>
        {this.renderDrawerButton()}
        {this.props.options.target === "left" &&
          this.renderWidgetButton("left-column")}
        {this.props.options.target === "right" &&
          this.renderWidgetButton("right-column")}
      </>
    );
  }

  /**
   * This is a bit of a special case. This method will render
   * not only plugins specified as Drawer plugins (target===toolbar),
   * but it will also render Widget plugins - given some special condition.
   *
   * Those special conditions are small screens, were there's no screen
   * estate to render the Widget button in Map Overlay.
   */
  renderDrawerButton() {
    return createPortal(
      <Hidden smUp={this.props.options.target !== "toolbar"}>
        <ListItem
          button
          divider={true}
          selected={this.state.windowVisible}
          onClick={this.handleButtonClick}
        >
          <ListItemIcon>{this.props.custom.icon}</ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
      </Hidden>,
      document.getElementById("plugin-buttons")
    );
  }

  renderWidgetButton(id) {
    return createPortal(
      // Hide Widget button on small screens, see renderDrawerButton too
      <Hidden xsDown>
        <Card
          icon={this.props.custom.icon}
          onClick={this.handleButtonClick}
          title={this.title}
          abstract={this.description}
        />
      </Hidden>,
      document.getElementById(id)
    );
  }

  render() {
    return this.renderWindow();
  }
}

export default withStyles(styles)(withTheme(BaseWindowPlugin));
