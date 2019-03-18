import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import SatelliteIcon from "@material-ui/icons/Satellite";
import Card from "../../components/Card.js";
import Window from "../../components/Window.js";
import InformativeView from "./InformativeView.js";
import InformativeModel from "./InformativeModel.js";
import Observer from "react-event-observer";

const styles = theme => {
  return {};
};

class Informative extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true,
      revision: Math.round(Math.random() * 1e8)
    });
  };

  open = chapter => {
    this.app.onPanelOpen(this);
    this.setState(
      {
        panelOpen: true
      },
      () => {
        this.observer.publish("changeChapter", chapter);
      }
    );
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(props) {
    super(props);
    this.type = "informative";
    this.options = props.options;
    this.title = this.options.title || "Översiktsplan";
    this.abstract =
      this.options.abstract || "Läs mer om vad som planeras i kommunen";
    this.caption = this.options.caption || "Titel";
    this.html = this.options.html || "<div>Html</div>";
    this.position = props.options.panel ? props.options.panel : undefined;
    this.app = props.app;
    this.observer = Observer();
    this.informativeModel = new InformativeModel({
      map: props.map,
      app: props.app,
      observer: this.observer,
      url: props.options.serviceUrl + "/" + props.options.document
    });
    this.app.registerPanel(this);
  }

  renderWindow(mode) {
    var left = this.position === "right" ? (window.innerWidth - 410) / 2 : 5;
    return createPortal(
      <Window
        localObserver={this.observer}
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        position={this.position}
        height="auto"
        width={400}
        top={210}
        left={left}
        mode={mode}
      >
        <InformativeView
          app={this.app}
          map={this.map}
          parent={this}
          observer={this.observer}
          caption={this.caption}
          abstract={this.html}
        />
      </Window>,
      document.getElementById("toolbar-panel")
    );
  }

  renderAsWidgetItem() {
    return (
      <div>
        <Card
          icon={<SatelliteIcon />}
          onClick={this.onClick}
          title={this.title}
          abstract={this.abstract}
        />
        {this.renderWindow("window")}
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
            <SatelliteIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderWindow("panel")}
      </div>
    );
  }

  render() {
    if (this.props.type === "toolbarItem") {
      return this.renderAsToolbarItem();
    }

    if (this.props.type === "widgetItem") {
      return this.renderAsWidgetItem();
    }

    return null;
  }
}

export default withStyles(styles)(Informative);
