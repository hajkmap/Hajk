import React, { Component } from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import CommentIcon from "@material-ui/icons/Comment";

import Panel from "../../components/Panel.js";
// import SuggestView from "./SuggestView.js";
// import SuggestModel from "./SuggestModel.js";
import Observer from "react-event-observer";

const { detect } = require("detect-browser");

const styles = theme => {
  return {};
};

class Suggest extends Component {
  state = {
    panelOpen: false
  };

  onClick = e => {
    // this.app.onPanelOpen(this);
    // this.setState({
    //   panelOpen: true
    // });
    window.alert("Nu kommer ditt mailprogram öppnas.");
    let result = {};
    // TODO: email, as well as subject and body pretext should be grabbed from config
    let email = "some.mail@somewhere.com";
    result["url"] = window.location.href;
    result["browser"] = detect();
    let string = `mailto:${email}?subject=HAJK3%20tips&body=write%20message%20above%20this%20string:%20${JSON.stringify(
      result
    )}`;
    console.log(result, string);
    window.location.href = string;
  };

  // closePanel = () => {
  //   this.setState({
  //     panelOpen: false
  //   });
  // };

  constructor(spec) {
    super(spec);
    this.text = "Redigera";
    this.app = spec.app;
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    // this.suggestModel = new SuggestModel({
    //   map: spec.map,
    //   app: spec.app,
    //   observer: this.observer
    // });
    this.app.registerPanel(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.panelOpen !== nextState.panelOpen;
  }

  componentWillMount() {
    this.setState({
      panelOpen: this.props.options.visibleAtStart
    });
  }

  // renderPanel() {
  //   return createPortal(
  //     <Panel
  //       title={this.text}
  //       onClose={this.closePanel}
  //       position="left"
  //       open={this.state.panelOpen}
  //     >
  //       <SuggestView
  //         app={this.app}
  //         map={this.map}
  //         parent={this}
  //         observer={this.observer}
  //       />
  //     </Panel>,
  //     document.getElementById("map-overlay")
  //   );
  // }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <div>
        <Button
          variant="fab"
          color="default"
          aria-label="Lämna synpunkter"
          className={classes.button}
          onClick={this.onClick}
        >
          <CommentIcon />
        </Button>
        {/* {this.renderPanel()} */}
      </div>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <CommentIcon />
          </ListItemIcon>
          <ListItemText primary={this.text} />
        </ListItem>
        {/* {this.renderPanel()} */}
      </div>
    );
  }

  render() {
    console.log("Suggest.js render()", this);

    if (this.props.type === "toolbarItem") {
      return this.renderAsToolbarItem();
    }

    if (this.props.type === "widgetItem") {
      return this.renderAsWidgetItem();
    }

    return null;
  }
}

export default withStyles(styles)(Suggest);
