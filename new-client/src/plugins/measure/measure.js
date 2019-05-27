import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import SvgIcon from "@material-ui/core/SvgIcon";
import MeasureView from "./MeasureView";
import MeasureModel from "./MeasureModel";
import Observer from "react-event-observer";
import Window from "../../components/Window.js";
import Card from "../../components/Card.js";

import "./measure.css";

const styles = theme => {
  return {};
};

function MeasureIcon(props) {
  var d = `M732.1,10L500.9,241.3l84.9,84.9l-34,34l-84.9-84.9l-91,91l84.9,84.9l-34,34l-84.9-84.9l-99.3,99.3l84.9,84.9l-34,34l-84.9-84.9L10,732.1L267.9,990L990,267.9L732.1,10z M230.8,819.7c-13.9,13.9-36.5,13.9-50.4,0c-13.9-13.9-13.9-36.5,0-50.4c13.9-13.9,36.5-13.9,50.4,0C244.7,783.2,244.7,805.8,230.8,819.7z`;

  return (
    <SvgIcon {...props} width="20pt" height="20pt" viewBox="0 0 1000 1000">
      <path d={d} />
    </SvgIcon>
  );
}

class Measure extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart || false
  };

  constructor(props) {
    super(props);
    this.type = "measure";
    this.options = props.options;
    this.title = this.options.title || "Mät";
    this.abstract = this.options.abstract || "Mät längder och ytor";
    this.position = props.options.panel ? props.options.panel : undefined;
    this.app = props.app;
    this.localObserver = Observer();
    this.model = new MeasureModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });
    this.app.registerPanel(this);
  }

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true,
      anchorEl: e.currentTarget
    });
    this.model.setActive(true);
  };

  closePanel = () => {
    this.setState({
      panelOpen: false,
      anchorEl: null
    });
    this.model.setActive(false);
  };

  renderWindow(mode) {
    const left = this.position === "right" ? (window.innerWidth - 410) / 2 : 5;
    return createPortal(
      <Window
        localObserver={this.observer}
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        position={this.position}
        height={300}
        width={300}
        top={210}
        left={left}
        mode={mode}
      >
        <MeasureView parent={this} />
      </Window>,
      document.getElementById("toolbar-panel")
    );
  }

  renderAsWidgetItem() {
    return (
      <div>
        <Card
          icon={<MeasureIcon />}
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
            <MeasureIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderWindow()}
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

export default withStyles(styles)(Measure);
