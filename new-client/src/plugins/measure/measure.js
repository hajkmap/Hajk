import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import SvgIcon from "@material-ui/core/SvgIcon";

import MeasureView from "./MeasureView";
import MeasureModel from "./MeasureModel";
import Observer from "react-event-observer";

import "./measure.css";

function MeasureIcon(props) {
  var d = `M732.1,10L500.9,241.3l84.9,84.9l-34,34l-84.9-84.9l-91,91l84.9,84.9l-34,34l-84.9-84.9l-99.3,99.3l84.9,84.9l-34,34l-84.9-84.9L10,732.1L267.9,990L990,267.9L732.1,10z M230.8,819.7c-13.9,13.9-36.5,13.9-50.4,0c-13.9-13.9-13.9-36.5,0-50.4c13.9-13.9,36.5-13.9,50.4,0C244.7,783.2,244.7,805.8,230.8,819.7z`;

  return (
    <SvgIcon {...props} width="20pt" height="20pt" viewBox="0 0 1000 1000">
      <path d={d} />
    </SvgIcon>
  );
}

class Measure extends React.PureComponent {
  constructor(props) {
    super(props);
    this.localObserver = Observer();

    this.model = new MeasureModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });
  }

  onWindowShow = () => {
    this.model.setActive(true);
  };

  onWindowHide = () => {
    this.model.setActive(false);
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Measure"
        custom={{
          icon: <MeasureIcon />,
          title: "Mät",
          description: "Mät längder och ytor",
          height: 400,
          width: 300,
          top: undefined,
          left: undefined,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide
        }}
      >
        <MeasureView
          model={this.model}
          app={this.props.app}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Measure;
